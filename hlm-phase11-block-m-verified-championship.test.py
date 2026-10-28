"""Isolated verified championship persistence acceptance. No production or archive writes."""
import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).parent
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,ROOT/path)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
ledger=load("m_ledger_verified","hlm-phase11-block-m-championship-ledger.py")
verified=load("m_verified","hlm-phase11-block-m-verified-championship.py")
class VerifiedChampionshipAcceptance(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.path=str(Path(self.tmp.name)/"isolated.db")
  self.db=sqlite3.connect(self.path,isolation_level=None)
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  self.state={"season":{"id":"SYNTHETIC-2026","games":[{"id":"G1","status":"final"}]},"extensions":{"phase10Playoffs":{"status":"complete","championTeamId":"A","rounds":[]}}}
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",1,json.dumps(self.state)))
  self.ledger=ledger.GuardedChampionshipEvidence(self.db,enabled=True)
  self.args=dict(franchise="F",gm="GM",revision=1,review_id="R1",decision_id="D1")
  self.ledger.prepare(**self.args)
  self.service=verified.VerifiedChampionshipSettlement(self.db,enabled=True,trusted_playoff_validator=lambda s:{"verified":True,"championTeamId":"A"})
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def count(self):
  try:return self.db.execute("SELECT COUNT(*) FROM block_m_verified_championships").fetchone()[0]
  except sqlite3.OperationalError:return 0
 def test_atomic_rollback_replay_and_reopen(self):
  self.assertFalse(self.service.commit(**self.args,approved=True,fail_at="before-commit")["committed"])
  self.assertEqual(self.count(),0)
  self.assertEqual(self.db.execute("SELECT status FROM block_m_championship_reviews").fetchone()[0],"pending")
  result=self.service.commit(**self.args,approved=True)
  self.assertTrue(result["committed"])
  self.assertFalse(result["archiveEligible"])
  self.assertEqual(self.count(),1)
  self.assertFalse(self.service.commit(**self.args,approved=True)["committed"])
  self.db.close();self.db=sqlite3.connect(self.path,isolation_level=None)
  reopened=verified.VerifiedChampionshipSettlement(self.db,enabled=True,trusted_playoff_validator=lambda s:{"verified":True,"championTeamId":"A"})
  self.assertEqual(reopened.recover(franchise="F",gm="GM",review_id="R1")["record"]["seasonId"],"SYNTHETIC-2026")
  self.assertFalse(reopened.recover(franchise="F",gm="GM",review_id="R1")["archiveEligible"])
 def test_proof_mismatch_stale_revision_and_cancel_fail_closed(self):
  wrong=verified.VerifiedChampionshipSettlement(self.db,enabled=True,trusted_playoff_validator=lambda s:{"verified":False})
  self.assertFalse(wrong.commit(**self.args,approved=True)["committed"])
  self.assertFalse(self.service.commit(**self.args,approved=False)["committed"])
  self.assertFalse(self.service.commit(**dict(self.args,gm="OTHER"),approved=True)["committed"])
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=2")
  self.assertFalse(self.service.commit(**self.args,approved=True)["committed"])
  self.assertEqual(self.count(),0)
 def test_default_off_and_bracket_tamper_block(self):
  off=verified.VerifiedChampionshipSettlement(self.db,trusted_playoff_validator=lambda s:{"verified":True,"championTeamId":"A"})
  self.assertFalse(off.commit(**self.args,approved=True)["committed"])
  changed=dict(self.state);changed["extensions"]={"phase10Playoffs":{"status":"complete","championTeamId":"B"}}
  self.db.execute("UPDATE block_a_lab_franchises SET game_state_json=?",(json.dumps(changed),))
  self.assertFalse(self.service.commit(**self.args,approved=True)["committed"])
  self.assertEqual(self.count(),0)
if __name__=="__main__":unittest.main()
