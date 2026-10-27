"""Experimental server-issued binding for an isolated franchise review.

The resolver MUST read authoritative franchise ownership and reviewed state from
SQLite, not from the browser payload. This module never writes franchise state.
"""
import hashlib
import hmac
import json
import secrets

FIELDS = ("franchise", "browserSaveId", "controlledTeamId", "gameId",
          "browserBaseline", "playerIds", "plan_id", "decision_id",
          "revision", "seed")

class IsolatedReviewBinding:
    def __init__(self, *, secret, authoritative_resolver):
        if not isinstance(secret, bytes) or len(secret) < 32:
            raise ValueError("Independent server secret required")
        if not callable(authoritative_resolver):
            raise ValueError("Authoritative SQLite resolver required")
        self._secret = secret
        self._resolver = authoritative_resolver

    def _canonical(self, value):
        return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()

    def _sign(self, data):
        return hmac.new(self._secret, self._canonical(data), hashlib.sha256).hexdigest()

    def issue(self, *, session, franchise):
        if not isinstance(session, dict) or not session.get("gm"):
            raise PermissionError("Authenticated GM required")
        record = self._resolver(session["gm"], franchise)
        if not isinstance(record, dict) or any(k not in record for k in FIELDS):
            raise PermissionError("Authoritative franchise binding unavailable")
        if record["franchise"] != franchise or record.get("owner_gm") != session["gm"]:
            raise PermissionError("Franchise ownership mismatch")
        if type(record["revision"]) is not int or record["revision"] < 0 or type(record["seed"]) is not int or record["seed"] < 0:
            raise ValueError("Invalid authoritative revision or seed")
        if not isinstance(record["playerIds"], list) or not record["playerIds"]:
            raise ValueError("Authoritative reviewed players required")
        data = {k: record[k] for k in FIELDS}
        data["gm"] = session["gm"]
        data["nonce"] = secrets.token_hex(16)
        return {"binding": data, "signature": self._sign(data)}

    def verify(self, *, session, envelope):
        if not isinstance(envelope, dict) or not isinstance(envelope.get("binding"), dict) or not isinstance(envelope.get("signature"), str):
            raise PermissionError("Server binding required")
        data = envelope["binding"]
        if set(data) != set(FIELDS) | {"gm", "nonce"} or not hmac.compare_digest(self._sign(data), envelope["signature"]):
            raise PermissionError("Invalid server binding")
        if not isinstance(session, dict) or session.get("gm") != data["gm"]:
            raise PermissionError("GM session mismatch")
        record = self._resolver(data["gm"], data["franchise"])
        if not isinstance(record, dict) or record.get("owner_gm") != data["gm"] or any(record.get(k) != data[k] for k in FIELDS):
            raise PermissionError("Stale or mismatched authoritative franchise")
        return {k: data[k] for k in FIELDS}
