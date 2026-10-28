"""Strict, default-off championship evidence gate for authoritative isolated SQLite state.

Requires a trusted host session bridge and an independently verified bracket
replay before any championship record can be persisted. No production writes.
"""
import hashlib
import json
import sqlite3

SCHEMA="""CREATE TABLE IF NOT EXISTS block_m_verified_championships (
 franchise TEXT NOT NULL, season_id TEXT NOT NULL, review_id TEXT NOT NULL UNIQUE,
 owner_gm TEXT NOT NULL, decision_id TEXT NOT NULL UNIQUE,
 source_revision INTEGER NOT NULL, bracket_digest TEXT NOT NULL,
 champion_team_id TEXT NOT NULL, record_json TEXT NOT NULL,
 PRIMARY KEY(franchise,season_id)
)"""

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=True)

class VerifiedChampionshipSettlement:
    def __init__(self, connection, *, trusted_playoff_validator, enabled=False):
        if not isinstance(connection,sqlite3.Connection) or not callable(trusted_playoff_validator):
            raise TypeError("Trusted SQLite connection and playoff validator required")
        self.db=connection
        self.validate=trusted_playoff_validator
        self.enabled=enabled is True

    def commit(self, *, franchise, gm, revision, review_id, decision_id, approved=False, fail_at=None):
        result={"committed":False,"productionSaved":False,"archiveEligible":False,"offseasonAuthorized":False}
        if not self.enabled or approved is not True:
            return dict(result,reason="disabled-or-not-approved")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            row=self.db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",(franchise,)).fetchone()
            review=self.db.execute("SELECT owner_gm,revision,bracket_digest,decision_id,status FROM block_m_championship_reviews WHERE review_id=? AND franchise=?",(review_id,franchise)).fetchone()
            if not row or type(revision) is not int or row[0]!=revision or not review or review!=(gm,revision,review[2],decision_id,"pending"):
                raise ValueError("stale-or-unauthorized-review")
            state=json.loads(row[1])
            season=state.get("season",{})
            games=season.get("games")
            if not isinstance(season.get("id"),str) or not season["id"] or not isinstance(games,list) or not games or any(not isinstance(g,dict) or g.get("status")!="final" for g in games):
                raise ValueError("regular-season-not-complete")
            bracket=state.get("extensions",{}).get("phase10Playoffs")
            digest=hashlib.sha256(canonical(bracket).encode()).hexdigest()
            if digest!=review[2]:raise ValueError("bracket-review-digest-mismatch")
            proof=self.validate(state)
            if not isinstance(proof,dict) or proof.get("verified") is not True or proof.get("championTeamId") is None or str(proof["championTeamId"])!=str(bracket.get("championTeamId")):
                raise ValueError("verified-playoff-provenance-required")
            record={"seasonId":season["id"],"championTeamId":proof["championTeamId"],
                    "sourceRevision":revision,"reviewId":review_id,"decisionId":decision_id,
                    "bracketDigest":digest,"source":"isolated-sqlite","official":False}
            self.db.execute(SCHEMA)
            self.db.execute("INSERT INTO block_m_verified_championships VALUES (?,?,?,?,?,?,?,?,?)",
                            (franchise,season["id"],review_id,gm,decision_id,revision,digest,str(proof["championTeamId"]),canonical(record)))
            if self.db.execute("UPDATE block_m_championship_reviews SET status='consumed' WHERE review_id=? AND status='pending'",(review_id,)).rowcount!=1:
                raise ValueError("replayed-review")
            if fail_at=="before-commit":raise RuntimeError("injected-rollback")
            self.db.execute("COMMIT")
            return dict(result,committed=True,record=record)
        except (ValueError,RuntimeError,sqlite3.IntegrityError) as error:
            self.db.execute("ROLLBACK")
            return dict(result,reason=str(error))
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def recover(self, *, franchise, gm, review_id):
        row=self.db.execute("SELECT record_json FROM block_m_verified_championships WHERE franchise=? AND owner_gm=? AND review_id=?",(franchise,gm,review_id)).fetchone()
        return {"record":json.loads(row[0]) if row else None,"productionSaved":False,
                "archiveEligible":False,"offseasonAuthorized":False}
