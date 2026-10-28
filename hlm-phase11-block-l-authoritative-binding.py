"""Experimental server-issued binding for an isolated franchise review.

The resolver MUST read authoritative franchise ownership and reviewed state from
SQLite, not from the browser payload. This module never writes franchise state.
"""
import hashlib
import hmac
import json
import secrets
import time

FIELDS = ("franchise", "browserSaveId", "controlledTeamId", "gameId",
          "browserBaseline", "playerIds", "plan_id", "decision_id",
          "revision", "seed")

class IsolatedReviewBinding:
    def __init__(self, *, secret, authoritative_resolver, clock=None, ttl_seconds=120):
        if not isinstance(secret, bytes) or len(secret) < 32:
            raise ValueError("Independent server secret required")
        if not callable(authoritative_resolver):
            raise ValueError("Authoritative SQLite resolver required")
        self._secret = secret
        if not isinstance(ttl_seconds, int) or isinstance(ttl_seconds, bool) or not 1 <= ttl_seconds <= 300:
            raise ValueError("Binding TTL must be 1 to 300 seconds")
        if clock is not None and not callable(clock):
            raise ValueError("Trusted clock required")
        self._resolver = authoritative_resolver
        self._clock = clock or time.time
        self._ttl = ttl_seconds

    def _canonical(self, value):
        return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()

    def _sign(self, data):
        return hmac.new(self._secret, self._canonical(data), hashlib.sha256).hexdigest()

    def _session_id(self, session):
        if not isinstance(session, dict) or not isinstance(session.get("session_id"), str) or not session["session_id"]:
            raise PermissionError("Authenticated session identifier required")
        return session["session_id"]

    def issue(self, *, session, franchise):
        if not isinstance(session, dict) or not session.get("gm"):
            raise PermissionError("Authenticated GM required")
        session_id = self._session_id(session)
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
        data["session_hash"] = hashlib.sha256(session_id.encode("utf-8")).hexdigest()
        now = int(self._clock())
        data["issued_at"] = now
        data["expires_at"] = now + self._ttl
        return {"binding": data, "signature": self._sign(data)}

    def verify(self, *, session, envelope):
        if not isinstance(envelope, dict) or not isinstance(envelope.get("binding"), dict) or not isinstance(envelope.get("signature"), str):
            raise PermissionError("Server binding required")
        data = envelope["binding"]
        if set(data) != set(FIELDS) | {"gm", "nonce", "session_hash", "issued_at", "expires_at"} or not hmac.compare_digest(self._sign(data), envelope["signature"]):
            raise PermissionError("Invalid server binding")
        if not isinstance(session, dict) or session.get("gm") != data["gm"]:
            raise PermissionError("GM session mismatch")
        session_id = self._session_id(session)
        if not hmac.compare_digest(hashlib.sha256(session_id.encode("utf-8")).hexdigest(), data["session_hash"]):
            raise PermissionError("Session binding mismatch")
        now = int(self._clock())
        if (type(data["issued_at"]) is not int or type(data["expires_at"]) is not int
                or data["issued_at"] > now or data["expires_at"] <= now
                or data["expires_at"] - data["issued_at"] != self._ttl):
            raise PermissionError("Expired or invalid server binding")
        record = self._resolver(data["gm"], data["franchise"])
        if not isinstance(record, dict) or record.get("owner_gm") != data["gm"] or any(record.get(k) != data[k] for k in FIELDS):
            raise PermissionError("Stale or mismatched authoritative franchise")
        return {k: data[k] for k in FIELDS}
