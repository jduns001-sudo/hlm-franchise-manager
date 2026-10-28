"""Fail-closed source-backed playoff settlement provenance acceptance."""
import importlib.util
import sqlite3
import json
import unittest
spec=importlib.util.spec_from_file_location("source",__file__.replace(".test.py",".py"))
source=importlib.util.module_from_spec(spec);spec.loader.exec_module(source)
class SQLiteProvenanceTests(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(":memory:",isolation_level=None)
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER)")
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES ('F',3)")
  self.adapter=source.SQLitePlayoffGameProvenance(self.db,franchise="F",gm="GM",revision=3,enabled=True)
  self.game={"gameId":"P1","status":"final","winnerTeamId":"A"}
 def tearDown(self):self.db.close()
 def proof(self):return self.adapter.verify("P1",{})
 def test_missing_authoritative_table_fails_closed(self):
  self.assertFalse(self.proof()["authenticated"])
 def test_verified_row_and_forged_approval_rejected(self):
  self.db.execute("""CREATE TABLE block_m_authoritative_playoff_game_settlements
   (franchise TEXT,game_id TEXT,owner_gm TEXT,source_revision INTEGER,game_json TEXT,
    review_id TEXT,decision_id TEXT,approval_status TEXT,settlement_status TEXT)""")
  self.db.execute("INSERT INTO block_m_authoritative_playoff_game_settlements VALUES (?,?,?,?,?,?,?,?,?)",
                  ("F","P1","GM",2,json.dumps(self.game),"R1","D1","gm-approved","committed"))
  self.assertTrue(self.proof()["authenticated"])
  for field,value in (("approval_status","pending"),("settlement_status","uncommitted"),("owner_gm","OTHER"),("source_revision",9)):
   original=self.db.execute("SELECT "+field+" FROM block_m_authoritative_playoff_game_settlements").fetchone()[0]
   self.db.execute("UPDATE block_m_authoritative_playoff_game_settlements SET "+field+"=?",(value,))
   self.assertFalse(self.proof()["authenticated"])
   self.db.execute("UPDATE block_m_authoritative_playoff_game_settlements SET "+field+"=?",(original,))
  self.db.execute("UPDATE block_m_authoritative_playoff_game_settlements SET game_json=?",(json.dumps(dict(self.game,winnerTeamId="B")),))
  self.assertNotEqual(self.proof()["game"],self.game)
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=4")
  self.assertFalse(self.proof()["authenticated"])
 def test_default_off(self):
  off=source.SQLitePlayoffGameProvenance(self.db,franchise="F",gm="GM",revision=3)
  self.assertFalse(off.verify("P1",{})["authenticated"])
if __name__=="__main__":unittest.main()
