"""Read-only authoritative Block E/I review-decision inspection.

Block E is a regular-season day settlement, not a playoff game settlement.
Never reinterpret a consumed day as proof of an approved playoff final.
"""
import sqlite3

class TrustedPlayoffDecisionAuthority:
    def __init__(self, connection, *, enabled=False):
        if not isinstance(connection,sqlite3.Connection):
            raise TypeError("SQLite connection required")
        self.db=connection
        self.enabled=enabled is True

    def verify(self, gm, franchise, review_id, decision_id, game_id, revision):
        denied={"authenticated":False,"approvedByGM":False,"committed":False}
        if not self.enabled or not all(isinstance(x,str) and x for x in
            (gm,franchise,review_id,decision_id,game_id)) or type(revision) is not int:
            return denied
        try:
            review=self.db.execute(
                """SELECT franchise_id,revision,consumed,decision_id,gm_proof_hash
                   FROM block_i_lab_reviews WHERE review_id=?""",(review_id,)).fetchone()
            decision=self.db.execute(
                """SELECT franchise_id,previous_revision,next_revision
                   FROM block_e_lab_consumed_days WHERE decision_id=?""",(decision_id,)).fetchone()
        except sqlite3.OperationalError:
            return denied
        if not review or not decision or review[0]!=franchise or decision[0]!=franchise:
            return denied
        if review[2]!=1 or review[3]!=decision_id or not review[4] or decision[1]!=review[1] or decision[2]!=review[1]+1:
            return denied
        # These durable rows prove a regular-season day decision only.
        # They contain no authoritative playoff game ID, final result, or
        # independently persisted GM approval for that specific final.
        return denied
