"""Block M isolated championship review ledger acceptance."""
import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).parent
spec=importlib.util.spec_from_file_location("block_m_ledger",ROOT/"hlm-phase11-block-m-championship-ledger.py")
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class ChampionshipLedgerAcceptance(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.path=str(Path(self.tmp.name)/"isolated.sqlite")
  self.db=sqlite3.connect(self.path,isolation_level=None)
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  import json
  self.state={"season":{"games":[{"id":"G1","status":"final"}]},"extensions":{"phase10Playoffs":{"status":"complete","championTeamId":"A","rounds":[]}}}
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",1,json.dumps(self.state)))
  self.ledger=mod.GuardedChampionshipEvidence(self.db,enabled=True)
  self.request=dict(franchise="F",gm="GM",revision=1,decision_id="D1",review_id="R1")
 def tearDown(self):
  self.db.close();self.tmp.cleanup()
 def test_disabled_and_no_approval_do_not_consume(self):
  disabled=mod.GuardedChampionshipEvidence(self.db)
  with self.assertRaises(PermissionError):disabled.prepare(**self.request)
  self.ledger.prepare(**self.request)
  self.assertFalse(self.ledger.settle(**self.request,approved=False)["committed"])
  self.assertEqual(self.ledger.recover(franchise="F",gm="GM",review_id="R1")["status"],"pending")
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_m_championship_settlements").fetchone()[0],0)
 def test_atomic_retry_replay_and_reopen(self):
  self.ledger.prepare(**self.request)
  self.assertFalse(self.ledger.settle(**self.request,approved=True,fail_at="before-commit")["committed"])
  self.assertEqual(self.ledger.recover(franchise="F",gm="GM",review_id="R1")["status"],"pending")
  settled=self.ledger.settle(**self.request,approved=True)
  self.assertTrue(settled["committed"])
  self.assertFalse(settled["championshipVerified"])
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_m_championship_settlements").fetchone()[0],1)
  self.db.close();self.db=sqlite3.connect(self.path,isolation_level=None)
  reopened=mod.GuardedChampionshipEvidence(self.db,enabled=True)
  recovery=reopened.recover(franchise="F",gm="GM",review_id="R1")
  self.assertEqual(recovery["status"],"consumed")
  self.assertTrue(recovery["evidenceRecorded"])
  self.assertFalse(recovery["archiveEligible"])
  self.assertFalse(reopened.settle(**self.request,approved=True)["committed"])
  self.assertEqual(self.db.execute("SELECT state_revision FROM block_a_lab_franchises").fetchone()[0],1)
 def test_stale_revision_and_wrong_gm_do_not_consume(self):
  self.ledger.prepare(**self.request)
  self.assertFalse(self.ledger.settle(**dict(self.request,gm="OTHER"),approved=True)["committed"])
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=2 WHERE franchise_id='F'")
  self.assertFalse(self.ledger.settle(**self.request,approved=True)["committed"])
  self.assertEqual(self.ledger.recover(franchise="F",gm="GM",review_id="R1")["status"],"stale")
if __name__=="__main__":unittest.main()
