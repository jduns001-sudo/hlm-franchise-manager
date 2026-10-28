"""End-to-end isolated Block M integration through real SQLite rows.

Test host credentials and upstream game settlement are controlled fixtures,
NOT evidence of a deployed trusted playoff-game settlement provider.
"""
import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).parent
def load(name,filename):
 spec=importlib.util.spec_from_file_location(name,ROOT/filename)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
writer_mod=load("m_writer_e2e","hlm-phase11-block-m-playoff-game-writer.py")
reader_mod=load("m_reader_e2e","hlm-phase11-block-m-sqlite-playoff-provenance.py")
ledger_mod=load("m_ledger_e2e","hlm-phase11-block-m-championship-ledger.py")
verified_mod=load("m_verified_e2e","hlm-phase11-block-m-verified-championship.py")
coordinator_mod=load("m_coordinator_e2e","hlm-phase11-block-m-championship-coordinator.py")
class EndToEndSQLite(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.path=str(Path(self.tmp.name)/"isolated.db")
  self.db=sqlite3.connect(self.path,isolation_level=None)
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  self.session=object()
  self.game={"gameId":"P1","status":"final","homeTeamId":"A","awayTeamId":"B","winnerTeamId":"A"}
  self.bracket={"bestOf":1,"rounds":[[{"highSeed":{"seed":1,"teamId":"A"},"lowSeed":{"seed":2,"teamId":"B"},"bestOf":1,"games":[self.game],"wins":{"A":1,"B":0},"winnerTeamId":"A","status":"complete"}]],"championTeamId":"A","status":"complete"}
  self.state={"season":{"id":"SYNTHETIC-2026","games":[{"id":"G1","status":"final"}]},"extensions":{"phase10Playoffs":self.bracket}}
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",1,json.dumps(self.state)))
  def authenticate(session):
   if session is not self.session:raise PermissionError("invalid-session")
   return {"gm":"GM","session_id":"trusted-fixture"}
  def owner(gm,franchise):
   if gm!="GM" or franchise!="F":return None
   row=self.db.execute("SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id='F'").fetchone()
   return {"owner_gm":"GM","franchise":"F","revision":row[0]}
  self.source={"authenticated":True,"approvedByGM":True,"committed":True,"game":self.game}
  def verify_committed_game(gm,franchise,review_id,decision_id,game_id,revision):
   if (gm,franchise,review_id,decision_id,game_id,revision)!=("GM","F","PR1","PD1","P1",1):return None
   return self.source
  self.writer=writer_mod.GuardedPlayoffGameWriter(self.db,session_verifier=authenticate,ownership_resolver=owner,
                    committed_game_verifier=verify_committed_game,enabled=True)
  self.reader=reader_mod.SQLitePlayoffGameProvenance(self.db,franchise="F",gm="GM",revision=1,enabled=True)
  self.ledger=ledger_mod.GuardedChampionshipEvidence(self.db,enabled=True)
  self.ledger.prepare(franchise="F",gm="GM",revision=1,decision_id="CD1",review_id="CR1")
  self.service=verified_mod.VerifiedChampionshipSettlement(self.db,trusted_playoff_validator=lambda s:{"verified":False},enabled=True)
  self.host=coordinator_mod.ChampionshipCoordinator(self.service,session_verifier=authenticate,franchise_resolver=owner,
                 game_provenance_verifier=self.reader.verify,enabled=True)
  self.service.validate=self.host.playoff_proof
  self.game_request=dict(session=self.session,franchise="F",revision=1,game_id="P1",review_id="PR1",decision_id="PD1",approved=True)
  self.champ_request=dict(session=self.session,franchise="F",revision=1,review_id="CR1",decision_id="CD1",approved=True)
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def test_missing_game_source_blocks_championship(self):
  self.assertFalse(self.host.settle(**self.champ_request)["committed"])
  self.assertFalse(self.reader.verify("P1",{})["authenticated"])
 def test_full_sqlite_writer_reader_coordinator_replay_and_reload(self):
  self.assertTrue(self.writer.record(**self.game_request)["committed"])
  self.assertTrue(self.reader.verify("P1",{})["authenticated"])
  self.assertFalse(self.writer.record(**self.game_request)["committed"])
  self.assertFalse(self.host.settle(**dict(self.champ_request,fail_at="before-commit"))["committed"])
  self.assertTrue(self.host.settle(**self.champ_request)["committed"])
  self.assertFalse(self.host.settle(**self.champ_request)["committed"])
  self.db.close()
  self.db=sqlite3.connect(self.path,isolation_level=None)
  self.reader=reader_mod.SQLitePlayoffGameProvenance(self.db,franchise="F",gm="GM",revision=1,enabled=True)
  self.service=verified_mod.VerifiedChampionshipSettlement(self.db,trusted_playoff_validator=lambda s:{"verified":False},enabled=True)
  self.host.settlement=self.service
  self.host.verify_game=self.reader.verify
  self.service.validate=self.host.playoff_proof
  self.assertTrue(self.reader.verify("P1",{})["authenticated"])
  recovered=self.host.recover(session=self.session,franchise="F",review_id="CR1")
  self.assertEqual(recovered["record"]["championTeamId"],"A")
  self.assertFalse(recovered["archiveEligible"])
 def test_forged_session_forged_final_stale_revision_and_decline(self):
  with self.assertRaises(PermissionError):self.writer.record(**dict(self.game_request,session={"gm":"GM"}))
  self.source={"authenticated":True,"approvedByGM":True,"committed":True,"game":dict(self.game,winnerTeamId="B")}
  self.assertFalse(self.writer.record(**self.game_request)["committed"])
  self.assertFalse(self.host.settle(**self.champ_request)["committed"])
  self.source={"authenticated":True,"approvedByGM":True,"committed":True,"game":self.game}
  self.assertFalse(self.writer.record(**dict(self.game_request,approved=False))["committed"])
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=2")
  self.assertFalse(self.writer.record(**self.game_request)["committed"])
  with self.assertRaises(PermissionError):self.host.settle(**self.champ_request)
 def test_default_off_production_isolation(self):
  disabled=writer_mod.GuardedPlayoffGameWriter(self.db,session_verifier=self.writer.session,
                ownership_resolver=self.writer.owner,committed_game_verifier=self.writer.game_source)
  self.assertFalse(disabled.record(**self.game_request)["committed"])
  self.assertEqual(self.db.execute("SELECT state_revision FROM block_a_lab_franchises").fetchone()[0],1)
  self.assertFalse(self.host.settle(**dict(self.champ_request,approved=False))["committed"])
if __name__=="__main__":unittest.main()
