"""Read-only, fail-closed playoff game provenance from trusted SQLite settlements.

This adapter does not create or populate a playoff settlement ledger. Until a
trusted game-settlement writer supplies the required rows, no championship
can pass provenance validation. No browser or production state is accessed.
"""
import json
import sqlite3

class SQLitePlayoffGameProvenance:
    def __init__(self, connection, *, franchise, gm, revision, enabled=False):
        if not isinstance(connection,sqlite3.Connection):
            raise TypeError("SQLite connection required")
        self.db=connection
        self.franchise=franchise
        self.gm=gm
        self.revision=revision
        self.enabled=enabled is True

    def verify(self, game_id, state):
        if not self.enabled or not isinstance(game_id,str) or not game_id:
            return {"authenticated":False,"approvedByGM":False}
        try:
            row=self.db.execute(
                """SELECT owner_gm,source_revision,game_json,review_id,decision_id,
                          approval_status,settlement_status
                   FROM block_m_authoritative_playoff_game_settlements
                   WHERE franchise=? AND game_id=?""",
                (self.franchise,game_id)).fetchone()
            current=self.db.execute(
                "SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",
                (self.franchise,)).fetchone()
        except sqlite3.OperationalError:
            return {"authenticated":False,"approvedByGM":False}
        if (not row or not current or current[0]!=self.revision or
            row[0]!=self.gm or type(row[1]) is not int or row[1]>self.revision or
            not all(isinstance(x,str) and x for x in (row[3],row[4])) or
            row[5]!="gm-approved" or row[6]!="committed"):
            return {"authenticated":False,"approvedByGM":False}
        try:
            game=json.loads(row[2])
        except (TypeError,ValueError):
            return {"authenticated":False,"approvedByGM":False}
        if not isinstance(game,dict) or game.get("gameId")!=game_id or game.get("status")!="final":
            return {"authenticated":False,"approvedByGM":False}
        return {"authenticated":True,"approvedByGM":True,"game":game}
