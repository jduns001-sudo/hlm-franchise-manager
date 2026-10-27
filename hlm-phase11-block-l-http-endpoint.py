"""Block L experimental HTTP command handler, deliberately unmounted by default.

Host integration must supply an authenticated session resolver, CSRF verifier,
franchise authorization and a Block L bridge factory. Never trust client GM fields.
This handler does not open a listener or touch production save paths.
"""
import json

class ExperimentalGMReviewEndpoint:
    def __init__(self, *, session_resolver, csrf_verifier, authorize, bridge_factory, origin):
        if not origin.startswith("https://") or origin.endswith("/"):
            raise ValueError("Exact HTTPS origin required")
        self.session_resolver = session_resolver
        self.csrf_verifier = csrf_verifier
        self.authorize = authorize
        self.bridge_factory = bridge_factory
        self.origin = origin

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
            if action not in ("review", "recover", "approve", "decline"):
                raise ValueError("invalid action")
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
