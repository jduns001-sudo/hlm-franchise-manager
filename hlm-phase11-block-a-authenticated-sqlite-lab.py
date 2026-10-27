"""TEST-ONLY authenticated SQLite settlement lab. Never import into production.
The lab owns its HMAC keys, decision registry, authoritative database and SQL.
Caller-supplied verifiers, state, signatures or database callbacks are ignored.
"""
import copy
import hashlib
import hmac
import json
import secrets
import sqlite3

class IsolatedAuthenticatedSettlementLab:
    def __init__(self, db):
        self._db = db
        self._gm_key = secrets.token_bytes(32)
        self._cpu_key = secrets.token_bytes(32)
        self._gm_sessions = {}
        self._cpu_decisions = {}

    @staticmethod
    def _sign(key, fields):
        return hmac.new(key, json.dumps(fields, separators=(",", ":")).encode(), hashlib.sha256).hexdigest()

    def issue_gm(self, franchise, gm):
        token = secrets.token_hex(16)
        fields = [token, franchise, gm]
        proof = self._sign(self._gm_key, fields)
        self._gm_sessions[token] = (franchise, gm, proof)
        return {"token": token, "franchise": franchise, "gm": gm, "proof": proof}

    def issue_cpu(self, franchise, revision, digest, decision="accepted"):
        identifier = secrets.token_hex(16)
        fields = [identifier, franchise, revision, digest, decision]
        proof = self._sign(self._cpu_key, fields)
        self._cpu_decisions[identifier] = (franchise, revision, digest, decision, proof)
        return {"id": identifier, "proof": proof}

    def settle(self, *, gm, cpu, franchise, revision, digest, approved=False,
               enabled=False, cancelled=False, declined=False, fail_at=None, **_untrusted):
        if not enabled or not approved or cancelled or declined:
            return {"committed": False, "reason": "approval-or-experiment-disabled", "productionSaved": False}
        session = self._gm_sessions.get(gm.get("token")) if isinstance(gm, dict) else None
        if not session or session != (franchise, gm.get("gm"), gm.get("proof")) or not hmac.compare_digest(session[2], gm["proof"]):
            return {"committed": False, "reason": "gm-untrusted", "productionSaved": False}
        decision = self._cpu_decisions.get(cpu.get("id")) if isinstance(cpu, dict) else None
        if not decision or decision[:4] != (franchise, revision, digest, "accepted") or not hmac.compare_digest(decision[4], cpu.get("proof", "")):
            return {"committed": False, "reason": "cpu-untrusted", "productionSaved": False}
        try:
            self._db.execute("BEGIN IMMEDIATE")
            row = self._db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?", (franchise,)).fetchone()
            if not row or row[0] != revision:
                raise ValueError("stale-revision")
            state = json.loads(row[1])
            links = ((state["universe"]["players"][0], "teamId"),
                     (state["assets"]["contracts"][0], "teamId"),
                     (state["assets"]["draftPicks"][0], "currentOwnerId"),
                     (state["universe"]["prospects"][0], "rightsTeamId"))
            if any(item[key] != "A" for item,key in links):
                raise ValueError("stale-linked-ownership")
            for item,key in links:
                item[key] = "B"
            state["activity"]["transactions"].append({"decision": cpu["id"], "synthetic": True})
            updated = self._db.execute(
                "UPDATE block_a_lab_franchises SET state_revision=?,game_state_json=? WHERE franchise_id=? AND state_revision=?",
                (revision+1,json.dumps(state),franchise,revision)).rowcount
            if updated != 1:
                raise ValueError("cas-rejected")
            if fail_at == "state":
                raise RuntimeError("injected-state")
            self._db.execute(
                "INSERT INTO block_a_lab_consumed_decisions(decision_id,franchise_id,proposal_digest,previous_revision,next_revision) VALUES (?,?,?,?,?)",
                (cpu["id"],franchise,digest,revision,revision+1))
            if fail_at == "replay":
                raise RuntimeError("injected-replay")
            self._db.execute(
                "INSERT INTO block_a_lab_transaction_history(transaction_id,franchise_id,decision_id,previous_revision,next_revision,asset_delta_json) VALUES (?,?,?,?,?,?)",
                ("lab-"+cpu["id"],franchise,cpu["id"],revision,revision+1,json.dumps({"synthetic":True,"linked":4})))
            if fail_at == "history":
                raise RuntimeError("injected-history")
            self._db.execute("COMMIT")
            return {"committed": True, "productionSaved": False}
        except (ValueError, RuntimeError, sqlite3.IntegrityError) as exc:
            self._db.execute("ROLLBACK")
            return {"committed": False, "reason": str(exc), "productionSaved": False}
        except BaseException:
            self._db.execute("ROLLBACK")
            raise
