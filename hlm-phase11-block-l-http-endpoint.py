"""Block L experimental HTTP command handler, deliberately unmounted by default.

Host integration must supply an authenticated session resolver, CSRF verifier,
franchise authorization and a Block L bridge factory. Never trust client GM fields.
This handler does not open a listener or touch production save paths.
"""
import json

class ExperimentalGMReviewEndpoint:
    def __init__(self, *, session_resolver, csrf_verifier, authorize, bridge_factory, origin, binding_verifier=None, binding_issuer=None):
        if not origin.startswith("https://") or origin.endswith("/"):
            raise ValueError("Exact HTTPS origin required")
        self.session_resolver = session_resolver
        self.csrf_verifier = csrf_verifier
        self.authorize = authorize
        self.bridge_factory = bridge_factory
        self.origin = origin
        if binding_verifier is not None and not callable(binding_verifier):
            raise ValueError('Trusted binding verifier required')
        self.binding_verifier = binding_verifier
        if binding_issuer is not None and not callable(binding_issuer):
            raise ValueError('Trusted binding issuer required')
        self.binding_issuer = binding_issuer

    def handle(self, *, headers, body):
        # A hosting application must independently authenticate its bearer token.
        if headers.get("Origin") != self.origin:
            return 403, {"committed": False, "error": "origin"}
        if headers.get("Content-Type", "").split(";")[0].strip().lower() != "application/json":
            return 415, {"committed": False, "error": "content_type"}
        try:
            if len(body) > 8192:
                raise ValueError("request too large")
            payload = json.loads(body)
            if not isinstance(payload, dict):
                raise ValueError("object required")
            session = self.session_resolver(headers.get("Authorization"))
            if not session or not session.get("gm"):
                return 401, {"committed": False, "error": "authentication"}
            if not self.csrf_verifier(session, headers.get("X-CSRF-Token")):
                return 403, {"committed": False, "error": "csrf"}
            franchise = payload.get("franchise")
            if not isinstance(franchise, str) or not franchise or not self.authorize(session, franchise):
                return 403, {"committed": False, "error": "franchise"}
            revision = payload.get("revision")
            if type(revision) is not int or revision < 0:
                raise ValueError("revision required")
            seed = payload.get("seed")
            if payload.get("action") != "recover" and (type(seed) is not int or seed < 0):
                raise ValueError("nonnegative integer seed required")
            action = payload.get("action")
            if action not in ("bind", "review", "recover", "approve", "decline"):
                raise ValueError("invalid action")
            if action == "bind":
                if self.binding_issuer is None:
                    return 403, {"committed": False, "error": "binding_disabled"}
                try:
                    issued = self.binding_issuer(session=session, franchise=franchise)
                except (PermissionError, ValueError, TypeError, KeyError):
                    return 403, {"committed": False, "error": "binding_unavailable"}
                if not isinstance(issued, dict) or not isinstance(issued.get("binding"), dict) or not isinstance(issued.get("signature"), str):
                    return 403, {"committed": False, "error": "binding_unavailable"}
                if issued["binding"].get("revision") != revision or issued["binding"].get("seed") != seed:
                    return 403, {"committed": False, "error": "binding_mismatch"}
                return 200, {"committed": False, "server_binding": issued}
            # Opt-in authoritative binding check before any coordinator dispatch.
            if self.binding_verifier is not None:
                try:
                    bound = self.binding_verifier(session=session, envelope=payload.get("server_binding"))
                except (PermissionError, ValueError, TypeError, KeyError):
                    return 403, {"committed": False, "error": "binding"}
                if not isinstance(bound, dict) or bound.get("franchise") != franchise or bound.get("revision") != revision:
                    return 403, {"committed": False, "error": "binding_mismatch"}
                if action != "recover" and bound.get("seed") != seed:
                    return 403, {"committed": False, "error": "binding_mismatch"}
                if action in ("approve", "decline") and bound.get("decision_id") != payload.get("decision_id"):
                    return 403, {"committed": False, "error": "binding_mismatch"}
            gm = session["gm"]
            bridge = self.bridge_factory(session, franchise)
            if action == "review":
                result = bridge.review(gm=gm, franchise=franchise, revision=revision, seed=payload["seed"])
            elif action == "recover":
                result = bridge.recover(gm=gm, franchise=franchise, review_id=payload["review_id"])
            else:
                result = bridge.decide(gm=gm, franchise=franchise, revision=revision,
                    seed=payload["seed"], decision_id=payload["decision_id"],
                    review_id=payload["review_id"], action=action)
            if not isinstance(result, dict):
                raise ValueError("invalid coordinator result")
            if "committed" in result and type(result["committed"]) is not bool:
                raise ValueError("invalid commit flag")
            return 200, {**result, "committed": bool(result.get("committed", False))}
        except (KeyError, ValueError, TypeError):
            return 400, {"committed": False, "error": "invalid_request"}
