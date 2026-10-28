"""Isolated SQLite championship approval ledger. No production save or archive writes."""
import hashlib
import json
import sqlite3

SCHEMA="""CREATE TABLE IF NOT EXISTS block_m_championship_reviews (
 review_id TEXT PRIMARY KEY, franchise TEXT NOT NULL, owner_gm TEXT NOT NULL,
 revision INTEGER NOT NULL, bracket_digest TEXT NOT NULL, decision_id TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL CHECK(status IN ('pending','consumed'))
)"""

def digest_bracket(bracket):
    return hashlib.sha256(json.dumps(bracket,sort_keys=True,separators=(",",":")).encode()).hexdigest()

class GuardedChampionshipEvidence:
    def __init__(self, connection, *, enabled=False):
        if not isinstance(connection,sqlite3.Connection):
            raise TypeError("SQLite connection required")
        self.db=connection
        self.enabled=enabled

    def prepare(self, *, franchise, gm, revision, decision_id, review_id):
        if not self.enabled: raise PermissionError("experimental championship disabled")
        if not all(isinstance(x,str) and x for x in (franchise,gm,decision_id,review_id)):
            raise ValueError("explicit identities required")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            row=self.db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",
                                (franchise,)).fetchone()
            if not row or row[0]!=revision: raise ValueError("stale franchise")
            state=json.loads(row[1])
            if any(g.get("status")!="final" for g in state.get("season",{}).get("games",[])):
                raise ValueError("unfinished regular season")
            bracket=state.get("extensions",{}).get("phase10Playoffs")
            if not bracket or bracket.get("status")!="complete" or not bracket.get("championTeamId"):
                raise ValueError("missing completed bracket")
            self.db.execute(SCHEMA)
            self.db.execute("INSERT INTO block_m_championship_reviews VALUES (?,?,?,?,?,?,'pending')",
                            (review_id,franchise,gm,revision,digest_bracket(bracket),decision_id))
            self.db.execute("COMMIT")
            return {"review_id":review_id,"status":"pending"}
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def settle(self, *, franchise, gm, revision, decision_id, review_id, approved=False, fail_at=None):
        result={"committed":False,"productionSaved":False}
        if not self.enabled or not approved:return dict(result,reason="approval-or-experiment-disabled")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            review=self.db.execute("SELECT franchise,owner_gm,revision,bracket_digest,decision_id,status FROM block_m_championship_reviews WHERE review_id=?",(review_id,)).fetchone()
            row=self.db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",(franchise,)).fetchone()
            if not review or review!=(franchise,gm,revision,review[3],decision_id,"pending") or not row or row[0]!=revision:
                raise ValueError("stale-or-consumed-review")
            state=json.loads(row[1])
            bracket=state.get("extensions",{}).get("phase10Playoffs")
            if not bracket or digest_bracket(bracket)!=review[3]:
                raise ValueError("playoff-bracket-changed")
            if any(g.get("status")!="final" for g in state.get("season",{}).get("games",[])):
                raise ValueError("unfinished regular season")
            changed=self.db.execute("UPDATE block_m_championship_reviews SET status='consumed' WHERE review_id=? AND status='pending'",(review_id,)).rowcount
            if changed!=1:raise ValueError("replayed-review")
            if fail_at=="before-commit":raise RuntimeError("injected-rollback")
            self.db.execute("COMMIT")
            return {"committed":True,"productionSaved":False,"review_id":review_id,"status":"consumed"}
        except (ValueError,RuntimeError) as exc:
            self.db.execute("ROLLBACK")
            return dict(result,reason=str(exc))
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def recover(self, *, franchise, gm, review_id):
        row=self.db.execute("SELECT owner_gm,revision,status FROM block_m_championship_reviews WHERE review_id=? AND franchise=?",(review_id,franchise)).fetchone()
        if not row or row[0]!=gm:raise PermissionError("review unavailable")
        current=self.db.execute("SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",(franchise,)).fetchone()
        return {"status":row[2] if row[2]=="consumed" else ("pending" if current and current[0]==row[1] else "stale"),
                "review_id":review_id}
