"""Default-off, playoff-specific GM review authority in isolated SQLite.

Trusted host authenticates sessions and resolves ownership. Approval and final
settlement are separate transactions. A settlement can only consume a review
bound to the exact source revision, session, game and final payload.
"""
import hashlib
import json
import sqlite3

SCHEMA="""CREATE TABLE IF NOT EXISTS block_m_playoff_reviews (
 review_id TEXT PRIMARY KEY, franchise TEXT NOT NULL, owner_gm TEXT NOT NULL,
 session_id TEXT NOT NULL, source_revision INTEGER NOT NULL,
 game_id TEXT NOT NULL, final_json TEXT NOT NULL, final_digest TEXT NOT NULL,
 decision_id TEXT UNIQUE, status TEXT NOT NULL CHECK(status IN ('pending','approved','consumed'))
)"""

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(",",":"))

class TrustedPlayoffReviewSettlement:
    def __init__(self, db, *, session_verifier, ownership_resolver, enabled=False):
        if not isinstance(db,sqlite3.Connection) or not callable(session_verifier) or not callable(ownership_resolver):
            raise TypeError("Trusted SQLite and host authentication required")
        self.db=db
        self.auth=session_verifier
        self.owner=ownership_resolver
        self.enabled=enabled is True

    def _identity(self, session, franchise, revision):
        if not self.enabled:raise PermissionError("playoff reviews disabled")
        identity=self.auth(session)
        if not isinstance(identity,dict) or not all(isinstance(identity.get(k),str) and identity[k] for k in ("gm","session_id")):
            raise PermissionError("authenticated host session required")
        authority=self.owner(identity["gm"],franchise)
        if not isinstance(authority,dict) or authority.get("owner_gm")!=identity["gm"] or authority.get("franchise")!=franchise or authority.get("revision")!=revision:
            raise PermissionError("ownership or revision mismatch")
        return identity

    def _current(self,franchise,revision,game_id,game):
        row=self.db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",(franchise,)).fetchone()
        if not row or row[0]!=revision:raise ValueError("stale source revision")
        state=json.loads(row[1])
        bracket=state.get("extensions",{}).get("phase10Playoffs",{})
        matches=[g for round_ in bracket.get("rounds",[]) for series in round_
                 for g in series.get("games",[]) if isinstance(g,dict) and g.get("gameId")==game_id]
        if len(matches)!=1 or matches[0]!=game or game.get("status")!="final":
            raise ValueError("final does not match authoritative bracket")

    def prepare(self, *, session, franchise, revision, review_id, game_id, game):
        identity=self._identity(session,franchise,revision)
        if not all(isinstance(v,str) and v for v in (review_id,game_id)) or not isinstance(game,dict):
            raise ValueError("invalid review")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            self._current(franchise,revision,game_id,game)
            self.db.execute(SCHEMA)
            final=canonical(game)
            self.db.execute("INSERT INTO block_m_playoff_reviews VALUES (?,?,?,?,?,?,?,?,?,?)",
                (review_id,franchise,identity["gm"],identity["session_id"],revision,game_id,final,
                 hashlib.sha256(final.encode()).hexdigest(),None,"pending"))
            self.db.execute("COMMIT")
            return {"prepared":True,"productionSaved":False}
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def approve(self, *, session, franchise, revision, review_id, decision_id, approved=False, fail_at=None):
        identity=self._identity(session,franchise,revision)
        if not approved:return {"approved":False}
        if not isinstance(decision_id,str) or not decision_id:raise ValueError("decision ID required")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            row=self.db.execute("SELECT owner_gm,session_id,source_revision,game_id,final_json,status FROM block_m_playoff_reviews WHERE review_id=? AND franchise=?",
                                (review_id,franchise)).fetchone()
            if not row or row[:3]!=(identity["gm"],identity["session_id"],revision) or row[5]!="pending":
                raise ValueError("stale or consumed review")
            self._current(franchise,revision,row[3],json.loads(row[4]))
            if self.db.execute("UPDATE block_m_playoff_reviews SET status='approved',decision_id=? WHERE review_id=? AND status='pending'",
                               (decision_id,review_id)).rowcount!=1:raise ValueError("replayed decision")
            if fail_at=="before-commit":raise RuntimeError("injected rollback")
            self.db.execute("COMMIT")
            return {"approved":True}
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def consume_for_game_writer(self, gm, franchise, review_id, decision_id, game_id, revision):
        # Called INSIDE the writer's BEGIN IMMEDIATE transaction. Never trust
        # client-supplied game claims or approval booleans here.
        row=self.db.execute("""SELECT owner_gm,source_revision,game_id,final_json,status,decision_id
                              FROM block_m_playoff_reviews WHERE review_id=? AND franchise=?""",
                            (review_id,franchise)).fetchone()
        if not row or row[0]!=gm or row[1]!=revision or row[2]!=game_id or row[4]!="approved" or row[5]!=decision_id:
            return {"authenticated":False,"approvedByGM":False,"committed":False}
        game=json.loads(row[3])
        self._current(franchise,revision,game_id,game)
        if self.db.execute("UPDATE block_m_playoff_reviews SET status='consumed' WHERE review_id=? AND status='approved'",(review_id,)).rowcount!=1:
            raise ValueError("review replay")
        return {"authenticated":True,"approvedByGM":True,"committed":True,"game":game}
