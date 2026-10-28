"""Authenticated Block M championship host boundary regression."""
import importlib.util
import sqlite3
import tempfile
import json
import unittest
from pathlib import Path
ROOT=Path(__file__).parent
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,ROOT/path)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
ledger_module=load("m_ledger","hlm-phase11-block-m-championship-ledger.py")
bridge_module=load("m_auth","hlm-phase11-block-m-authenticated-championship.py")
class AuthenticatedChampionshipTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.db=sqlite3.connect(str(Path(self.tmp.name)/"lab.db"),isolation_level=None)
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  state={"season":{"games":[{"id":"G1","status":"final"}]},"extensions":{"phase10Playoffs":{"status":"complete","championTeamId":"A"}}}
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",1,json.dumps(state)))
  self.ledger=ledger_module.GuardedChampionshipEvidence(self.db,enabled=True)
  self.active={"session_id":"SERVER-SESSION-1","gm":"GM"}
  def verify(session):
   if session is not self.active:raise PermissionError("host session invalid")
   return dict(self.active)
  def resolve(gm,franchise):
   return {"owner_gm":"GM","franchise":"F","revision":self.db.execute("SELECT state_revision FROM block_a_lab_franchises").fetchone()[0]}
  self.bridge=bridge_module.AuthenticatedChampionshipBridge(self.ledger,session_verifier=verify,authority_resolver=resolve,enabled=True)
  self.args=dict(session=self.active,franchise="F",revision=1,decision_id="D1",review_id="R1")
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def test_authenticated_prepare_approval_replay_and_reopen(self):
  self.bridge.prepare(**self.args)
  self.assertFalse(self.bridge.settle(**self.args,approved=False)["committed"])
  self.assertFalse(self.bridge.settle(**self.args,approved=True,fail_at="before-commit")["committed"])
  self.assertTrue(self.bridge.settle(**self.args,approved=True)["committed"])
  self.assertFalse(self.bridge.settle(**self.args,approved=True)["committed"])
  self.assertEqual(self.bridge.recover(session=self.active,franchise="F",review_id="R1")["status"],"consumed")
 def test_wrong_session_revoked_session_and_stale_revision_fail_closed(self):
  with self.assertRaises(PermissionError):self.bridge.prepare(**dict(self.args,session={"gm":"GM","session_id":"FORGED"}))
  self.bridge.prepare(**self.args)
  old=self.active;self.active={"gm":"GM","session_id":"ROTATED"}
  with self.assertRaises(PermissionError):self.bridge.settle(**self.args,approved=True)
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=2")
  with self.assertRaises(PermissionError):self.bridge.settle(**dict(self.args,session=self.active),approved=True)
  self.assertEqual(self.db.execute("SELECT status FROM block_m_championship_reviews").fetchone()[0],"pending")
 def test_default_off_blocks_commands(self):
  disabled=bridge_module.AuthenticatedChampionshipBridge(self.ledger,session_verifier=lambda s:self.active,authority_resolver=lambda g,f:{"owner_gm":"GM","franchise":"F","revision":1})
  with self.assertRaises(PermissionError):disabled.prepare(**self.args)
if __name__=="__main__":unittest.main()
