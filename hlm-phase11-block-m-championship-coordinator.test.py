"""End-to-end isolated coordinator acceptance; real Phase 10 Node replay."""
import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).parent
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,ROOT/path)
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
ledger=load("coordinator_ledger","hlm-phase11-block-m-championship-ledger.py")
verified=load("coordinator_verified","hlm-phase11-block-m-verified-championship.py")
coordinator=load("coordinator_module","hlm-phase11-block-m-championship-coordinator.py")
class CoordinatorAcceptance(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.path=str(Path(self.tmp.name)/"isolated.db")
  self.db=sqlite3.connect(self.path,isolation_level=None,timeout=0.5)
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  game={"gameId":"P1","status":"final","homeTeamId":"A","awayTeamId":"B","winnerTeamId":"A"}
  bracket={"bestOf":1,"rounds":[[{"highSeed":{"seed":1,"teamId":"A"},"lowSeed":{"seed":2,"teamId":"B"},"bestOf":1,"games":[game],"wins":{"A":1,"B":0},"winnerTeamId":"A","status":"complete"}]],"championTeamId":"A","status":"complete"}
  self.state={"season":{"id":"SYNTHETIC-2026","games":[{"id":"G1","status":"final"}]},"extensions":{"phase10Playoffs":bracket}}
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",1,json.dumps(self.state)))
  self.ledger=ledger.GuardedChampionshipEvidence(self.db,enabled=True)
  self.args=dict(franchise="F",revision=1,review_id="R1",decision_id="D1")
  self.ledger.prepare(**dict(self.args,gm="GM"))
  self.session=object()
  self.provenance={"P1":{"authenticated":True,"approvedByGM":True,"game":game}}
  self.service=verified.VerifiedChampionshipSettlement(self.db,trusted_playoff_validator=lambda s:{"verified":False},enabled=True)
  def auth(s):
   if s is not self.session:raise PermissionError("forged-session")
   return {"gm":"GM","session_id":"server-1"}
  def owner(g,f):return {"owner_gm":"GM","franchise":"F","revision":self.db.execute("SELECT state_revision FROM block_a_lab_franchises").fetchone()[0]}
  self.host=coordinator.ChampionshipCoordinator(self.service,session_verifier=auth,franchise_resolver=owner,
                   game_provenance_verifier=lambda gid,s:self.provenance.get(gid),enabled=True)
  self.service.validate=self.host.playoff_proof
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def call(self,**kwargs):return self.host.settle(session=self.session,approved=True,**dict(self.args,**kwargs))
 def test_atomic_rollback_replay_reload(self):
  self.assertFalse(self.call(fail_at="before-commit")["committed"])
  self.assertTrue(self.call()["committed"])
  self.assertFalse(self.call()["committed"])
  self.db.close();self.db=sqlite3.connect(self.path,isolation_level=None)
  # Recovery must use a newly bound host and settlement, never a closed handle.
  self.service=verified.VerifiedChampionshipSettlement(self.db,trusted_playoff_validator=lambda s:{"verified":False},enabled=True)
  self.host.settlement=self.service
  self.service.validate=self.host.playoff_proof
  self.assertEqual(self.host.recover(session=self.session,franchise="F",review_id="R1")["record"]["championTeamId"],"A")
  self.assertFalse(self.host.recover(session=self.session,franchise="F",review_id="R1")["archiveEligible"])
 def test_forged_session_fabricated_provenance_and_stale_revision(self):
  with self.assertRaises(PermissionError):self.host.settle(session={"gm":"GM"},approved=True,**self.args)
  self.provenance["P1"]["game"]={"gameId":"P1","winnerTeamId":"B"}
  self.assertFalse(self.call()["committed"])
  self.provenance["P1"]["game"]=self.state["extensions"]["phase10Playoffs"]["rounds"][0][0]["games"][0]
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=2")
  with self.assertRaises(PermissionError):self.call()
 def test_invalid_bracket_and_default_off(self):
  self.state["extensions"]["phase10Playoffs"]["championTeamId"]="B"
  self.db.execute("UPDATE block_a_lab_franchises SET game_state_json=?",(json.dumps(self.state),))
  self.assertFalse(self.call()["committed"])
  self.host.enabled=False
  with self.assertRaises(PermissionError):self.call()
 def test_concurrent_second_connection_cannot_replay(self):
  self.assertTrue(self.call()["committed"])
  second=sqlite3.connect(self.path,isolation_level=None)
  try:
   other=verified.VerifiedChampionshipSettlement(second,trusted_playoff_validator=lambda s:{"verified":True,"championTeamId":"A"},enabled=True)
   self.assertFalse(other.commit(franchise="F",gm="GM",revision=1,review_id="R1",decision_id="D1",approved=True)["committed"])
  finally:second.close()
if __name__=="__main__":unittest.main()
