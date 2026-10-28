"""Default-off transactional writer for isolated, GM-approved playoff finals.

Only a trusted host may supply an authenticated GM session and a previously
reviewed, committed final. The browser cannot mint authoritative rows.
"""
import hashlib
import json
import sqlite3

SCHEMA="""CREATE TABLE IF NOT EXISTS block_m_authoritative_playoff_game_settlements (
 franchise TEXT NOT NULL,game_id TEXT NOT NULL,owner_gm TEXT NOT NULL,
 source_revision INTEGER NOT NULL,game_json TEXT NOT NULL,
 review_id TEXT NOT NULL UNIQUE,decision_id TEXT NOT NULL UNIQUE,
 approval_status TEXT NOT NULL CHECK(approval_status='gm-approved'),
 settlement_status TEXT NOT NULL CHECK(settlement_status='committed'),
 PRIMARY KEY(franchise,game_id)
)"""

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=True)

class GuardedPlayoffGameWriter:
    def __init__(self, connection, *, session_verifier, ownership_resolver,
                 committed_game_verifier, enabled=False):
        if not isinstance(connection,sqlite3.Connection) or not all(callable(x) for x in
          (session_verifier,ownership_resolver,committed_game_verifier)):
            raise TypeError("Trusted SQLite and host verifiers required")
        self.db=connection
        self.session=session_verifier
        self.owner=ownership_resolver
        self.game_source=committed_game_verifier
        self.enabled=enabled is True

    def record(self, *, session, franchise, revision, game_id, review_id,
               decision_id, approved=False, fail_at=None):
        result={"committed":False,"productionSaved":False,"archiveEligible":False}
        if not self.enabled or approved is not True:
            return dict(result,reason="disabled-or-declined")
        identity=self.session(session)
        if not isinstance(identity,dict) or not identity.get("gm") or not identity.get("session_id"):
            raise PermissionError("authenticated GM required")
        gm=identity["gm"]
        self.db.execute("BEGIN IMMEDIATE")
        try:
            authority=self.owner(gm,franchise)
            row=self.db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",(franchise,)).fetchone()
            if (not row or type(revision) is not int or row[0]!=revision or
                not isinstance(authority,dict) or authority.get("owner_gm")!=gm or
                authority.get("franchise")!=franchise or authority.get("revision")!=revision):
                raise ValueError("stale-or-unauthorized-franchise")
            state=json.loads(row[1])
            bracket=state.get("extensions",{}).get("phase10Playoffs")
            if not isinstance(bracket,dict):
                raise ValueError("playoff-bracket-unavailable")
            matches=[g for round_ in bracket.get("rounds",[]) for series in round_
                     for g in series.get("games",[]) if g.get("gameId")==game_id]
            if len(matches)!=1 or matches[0].get("status")!="final":
                raise ValueError("unique-committed-final-required")
            game=matches[0]
            # A real Block M review consumer must match the authenticated
            # session that originally prepared the review, not merely the GM.
            if getattr(self.game_source,"__name__",None)=="consume_for_game_writer":
                binding=self.db.execute(
                    "SELECT session_id FROM block_m_playoff_reviews WHERE review_id=? AND franchise=?",
                    (review_id,franchise)).fetchone()
                if not binding or binding[0]!=identity["session_id"]:
                    raise ValueError("stale-or-forged-review-session")
            source=self.game_source(gm,franchise,review_id,decision_id,game_id,revision)
            if (not isinstance(source,dict) or source.get("authenticated") is not True or
                source.get("approvedByGM") is not True or source.get("committed") is not True or
                source.get("game")!=game):
                raise ValueError("authenticated-game-settlement-required")
            if not all(isinstance(x,str) and x for x in (game_id,review_id,decision_id)):
                raise ValueError("invalid-settlement-identifiers")
            self.db.execute(SCHEMA)
            self.db.execute("INSERT INTO block_m_authoritative_playoff_game_settlements VALUES (?,?,?,?,?,?,?,?,?)",
                (franchise,game_id,gm,revision,canonical(game),review_id,decision_id,"gm-approved","committed"))
            if fail_at=="before-commit":raise RuntimeError("injected-rollback")
            self.db.execute("COMMIT")
            return dict(result,committed=True,gameId=game_id)
        except (ValueError,RuntimeError,sqlite3.IntegrityError) as exc:
            self.db.execute("ROLLBACK")
            return dict(result,reason=str(exc))
        except BaseException:
            self.db.execute("ROLLBACK")
            raise
