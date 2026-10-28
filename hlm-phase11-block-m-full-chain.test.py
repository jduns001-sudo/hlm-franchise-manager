"""Full-chain isolated playoff approval to championship evidence acceptance.

Host session is a controlled fixture; the approval and game provenance are
persisted in SQLite through the real Block M review and writer contracts.
"""
import importlib.util
import json
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
ROOT=Path(__file__).parent
def load(name,filename):
 spec=importlib.util.spec_from_file_location(name,ROOT/filename)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
review_mod=load("full_review","hlm-phase11-block-m-playoff-review-settlement.py")
writer_mod=load("full_writer","hlm-phase11-block-m-playoff-game-writer.py")
reader_mod=load("full_reader","hlm-phase11-block-m-sqlite-playoff-provenance.py")
ledger_mod=load("full_ledger","hlm-phase11-block-m-championship-ledger.py")
verified_mod=load("full_verified","hlm-phase11-block-m-verified-championship.py")
coordinator_mod=load("full_coordinator","hlm-phase11-block-m-championship-coordinator.py")
class FullChain(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.db=sqlite3.connect(str(Path(self.tmp.name)/"isolated.db"),isolation_level=None,timeout=5)
  self.session=object()
  self.session_id="HOST-SESSION-1"
  self.game={"gameId":"P1","status":"final","homeTeamId":"A","awayTeamId":"B","winnerTeamId":"A"}
  # This fixture matches Phase 10's bracket shape; replay is executed by Node.
  self.bracket={"bestOf":1,"rounds":[[{"highSeed":{"seed":1,"teamId":"A"},"lowSeed":{"seed":2,"teamId":"B"},"bestOf":1,"games":[self.game],"wins":{"A":1,"B":0},"winnerTeamId":"A","status":"complete"}]],"championTeamId":"A","status":"complete"}
  self.state={"season":{"id":"SYNTHETIC-2026","games":[{"id":"G1","status":"final"}]},"extensions":{"phase10Playoffs":self.bracket}}
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",1,json.dumps(self.state)))
  self.bind()
 def bind(self):
  def auth(s):
   if s is not self.session:raise PermissionError("forged-session")
   return {"gm":"GM","session_id":self.session_id}
  def owner(g,f):
   row=self.db.execute("SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",(f,)).fetchone()
   return {"owner_gm":"GM","franchise":"F","revision":row[0]} if g=="GM" and f=="F" and row else None
  self.review=review_mod.TrustedPlayoffReviewSettlement(self.db,session_verifier=auth,ownership_resolver=owner,enabled=True)
  self.writer=writer_mod.GuardedPlayoffGameWriter(self.db,session_verifier=auth,ownership_resolver=owner,committed_game_verifier=self.review.consume_for_game_writer,enabled=True)
  self.reader=reader_mod.SQLitePlayoffGameProvenance(self.db,franchise="F",gm="GM",revision=1,enabled=True)
  self.ledger=ledger_mod.GuardedChampionshipEvidence(self.db,enabled=True)
  self.service=verified_mod.VerifiedChampionshipSettlement(self.db,trusted_playoff_validator=lambda s:{"verified":False},enabled=True)
  self.host=coordinator_mod.ChampionshipCoordinator(self.service,session_verifier=auth,franchise_resolver=owner,game_provenance_verifier=self.reader.verify,enabled=True)
  self.service.validate=self.host.playoff_proof
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def prepare(self):
  self.review.prepare(session=self.session,franchise="F",revision=1,review_id="PR1",game_id="P1",game=self.game)
  self.ledger.prepare(franchise="F",gm="GM",revision=1,review_id="CR1",decision_id="CD1")
 def approve(self):
  return self.review.approve(session=self.session,franchise="F",revision=1,review_id="PR1",decision_id="PD1",approved=True)
 def write(self,**kw):
  return self.writer.record(session=self.session,franchise="F",revision=1,game_id="P1",review_id="PR1",decision_id="PD1",approved=True,**kw)
 def settle(self,**kw):
  return self.host.settle(session=self.session,franchise="F",revision=1,review_id="CR1",decision_id="CD1",approved=True,**kw)
 def test_review_writer_reader_replay_championship_recovery(self):
  self.prepare()
  self.assertFalse(self.settle()["committed"])
  self.assertFalse(self.write()["committed"])
  self.approve()
  self.assertFalse(self.write(fail_at="before-commit")["committed"])
  self.assertEqual(self.db.execute("SELECT status FROM block_m_playoff_reviews").fetchone()[0],"approved")
  self.assertTrue(self.write()["committed"])
  self.assertTrue(self.reader.verify("P1",{})["authenticated"])
  self.assertFalse(self.write()["committed"])
  self.assertFalse(self.settle(fail_at="before-commit")["committed"])
  self.assertTrue(self.settle()["committed"])
  self.assertFalse(self.settle()["committed"])
  self.db.close()
  self.db=sqlite3.connect(str(Path(self.tmp.name)/"isolated.db"),isolation_level=None)
  self.bind()
  self.assertTrue(self.reader.verify("P1",{})["authenticated"])
  recovered=self.host.recover(session=self.session,franchise="F",review_id="CR1")
  self.assertEqual(recovered["record"]["championTeamId"],"A")
  self.assertFalse(recovered["archiveEligible"])
 def test_forged_session_final_and_stale_revision(self):
  self.prepare()
  with self.assertRaises(PermissionError):
   self.review.approve(session={"gm":"GM"},franchise="F",revision=1,review_id="PR1",decision_id="PD1",approved=True)
  self.session_id="ROTATED"
  with self.assertRaises(ValueError):self.approve()
  self.session_id="HOST-SESSION-1"
  self.approve()
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=2")
  self.assertFalse(self.write()["committed"])
  with self.assertRaises(PermissionError):self.settle()
 def test_declined_default_off_and_production_isolation(self):
  self.prepare()
  self.assertFalse(self.review.approve(session=self.session,franchise="F",revision=1,review_id="PR1",decision_id="PD1",approved=False)["approved"])
  self.assertFalse(self.write()["committed"])
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_m_verified_championships").fetchone()[0] if self.db.execute("SELECT name FROM sqlite_master WHERE name='block_m_verified_championships'").fetchone() else 0,0)
  self.assertEqual(self.db.execute("SELECT state_revision FROM block_a_lab_franchises").fetchone()[0],1)
 def test_tampered_final_and_expired_session_fail_closed(self):
  self.prepare()
  self.approve()
  self.db.execute("UPDATE block_a_lab_franchises SET game_state_json=?",
                  (json.dumps(dict(self.state,extensions={"phase10Playoffs":dict(self.bracket,championTeamId="B")})),))
  self.assertFalse(self.settle()["committed"])
  self.db.execute("UPDATE block_a_lab_franchises SET game_state_json=?",(json.dumps(self.state),))
  self.session_id="EXPIRED-SESSION"
  self.assertFalse(self.write()["committed"])
  self.session_id="HOST-SESSION-1"
  self.assertTrue(self.write()["committed"])
  self.assertFalse(self.settle(fail_at="before-commit")["committed"])
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_m_verified_championships").fetchone()[0] if self.db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='block_m_verified_championships'").fetchone() else 0,0)
 def test_two_sqlite_writers_one_final_and_one_champion(self):
  self.prepare()
  self.approve()
  barrier=threading.Barrier(3)
  results=[]
  errors=[]
  def attempt():
   db=sqlite3.connect(str(Path(self.tmp.name)/"isolated.db"),isolation_level=None,timeout=5)
   def auth(s):
    if s is not self.session:raise PermissionError("invalid-session")
    return {"gm":"GM","session_id":"HOST-SESSION-1"}
   def owner(g,f):return {"owner_gm":"GM","franchise":"F","revision":1}
   review=review_mod.TrustedPlayoffReviewSettlement(db,session_verifier=auth,ownership_resolver=owner,enabled=True)
   writer=writer_mod.GuardedPlayoffGameWriter(db,session_verifier=auth,ownership_resolver=owner,
                     committed_game_verifier=review.consume_for_game_writer,enabled=True)
   try:
    barrier.wait(timeout=5)
    results.append(writer.record(session=self.session,franchise="F",revision=1,game_id="P1",
                                 review_id="PR1",decision_id="PD1",approved=True))
   except BaseException as exc:errors.append(str(exc))
   finally:db.close()
  threads=[threading.Thread(target=attempt) for _ in range(2)]
  for thread in threads:thread.start()
  barrier.wait(timeout=5)
  for thread in threads:thread.join(timeout=15)
  self.assertFalse(any(thread.is_alive() for thread in threads))
  self.assertEqual(errors,[])
  self.assertEqual(sum(bool(x["committed"]) for x in results),1)
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_m_authoritative_playoff_game_settlements").fetchone()[0],1)
  self.assertTrue(self.reader.verify("P1",{})["authenticated"])
  self.assertTrue(self.settle()["committed"])
  self.assertFalse(self.settle()["committed"])
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_m_verified_championships").fetchone()[0],1)
if __name__=="__main__":unittest.main()
