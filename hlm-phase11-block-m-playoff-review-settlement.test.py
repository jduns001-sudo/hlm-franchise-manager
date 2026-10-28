"""Actual isolated SQLite review-to-game-writer acceptance, no mock approval callback."""
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
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
review_mod=load("review_contract","hlm-phase11-block-m-playoff-review-settlement.py")
writer_mod=load("review_writer","hlm-phase11-block-m-playoff-game-writer.py")
reader_mod=load("review_reader","hlm-phase11-block-m-sqlite-playoff-provenance.py")
class ReviewContractTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.path=str(Path(self.tmp.name)/"isolated.db")
  self.db=sqlite3.connect(self.path,isolation_level=None,timeout=5)
  self.game={"gameId":"P1","status":"final","homeTeamId":"A","awayTeamId":"B","winnerTeamId":"A"}
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",1,json.dumps({"extensions":{"phase10Playoffs":{"rounds":[[{"games":[self.game]}]]}}})))
  self.session=object()
  self.session_id="HOST-SESSION-1"
  self._bind(self.db)
  self.args=dict(session=self.session,franchise="F",revision=1,review_id="R1",game_id="P1",game=self.game)
  self.review.prepare(**self.args)
 def _bind(self,db):
  def auth(s):
   if s is not self.session:raise PermissionError("forged session")
   return {"gm":"GM","session_id":self.session_id}
  def owner(g,f):
   row=db.execute("SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",(f,)).fetchone()
   return {"owner_gm":"GM","franchise":"F","revision":row[0]}
  self.review=review_mod.TrustedPlayoffReviewSettlement(db,session_verifier=auth,ownership_resolver=owner,enabled=True)
  self.writer=writer_mod.GuardedPlayoffGameWriter(db,session_verifier=auth,ownership_resolver=owner,committed_game_verifier=self.review.consume_for_game_writer,enabled=True)
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def approve(self,**kw):return self.review.approve(session=self.session,franchise="F",revision=1,review_id="R1",decision_id="D1",approved=True,**kw)
 def write(self):return self.writer.record(session=self.session,franchise="F",revision=1,game_id="P1",review_id="R1",decision_id="D1",approved=True)
 def test_review_approval_writer_reader_and_reload(self):
  self.assertFalse(self.write()["committed"])
  self.assertTrue(self.approve()["approved"])
  self.assertTrue(self.write()["committed"])
  self.assertFalse(self.write()["committed"])
  self.assertEqual(self.db.execute("SELECT status FROM block_m_playoff_reviews").fetchone()[0],"consumed")
  self.db.close();self.db=sqlite3.connect(self.path,isolation_level=None)
  self._bind(self.db)
  reader=reader_mod.SQLitePlayoffGameProvenance(self.db,franchise="F",gm="GM",revision=1,enabled=True)
  self.assertTrue(reader.verify("P1",{})["authenticated"])
  self.assertFalse(self.write()["committed"])
 def test_rollback_preserves_approval(self):
  with self.assertRaises(RuntimeError):self.approve(fail_at="before-commit")
  self.assertEqual(self.db.execute("SELECT status FROM block_m_playoff_reviews").fetchone()[0],"pending")
  self.approve()
  self.assertFalse(self.writer.record(session=self.session,franchise="F",revision=1,game_id="P1",review_id="R1",decision_id="D1",approved=True,fail_at="before-commit")["committed"])
  self.assertEqual(self.db.execute("SELECT status FROM block_m_playoff_reviews").fetchone()[0],"approved")
  self.assertTrue(self.write()["committed"])
 def test_stale_session_forged_final_and_revision(self):
  with self.assertRaises(PermissionError):self.review.approve(session={"gm":"GM"},franchise="F",revision=1,review_id="R1",decision_id="D1",approved=True)
  self.session_id="ROTATED"
  with self.assertRaises(ValueError):self.approve()
  self.session_id="HOST-SESSION-1"
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=2")
  with self.assertRaises(PermissionError):self.approve()
 def test_competing_approvals_one_wins(self):
  results=[];barrier=threading.Barrier(3)
  def worker():
   db=sqlite3.connect(self.path,isolation_level=None,timeout=5)
   def auth(s):return {"gm":"GM","session_id":"HOST-SESSION-1"}
   def owner(g,f):return {"owner_gm":"GM","franchise":"F","revision":1}
   service=review_mod.TrustedPlayoffReviewSettlement(db,session_verifier=auth,ownership_resolver=owner,enabled=True)
   barrier.wait(timeout=5)
   try:results.append(service.approve(session=self.session,franchise="F",revision=1,review_id="R1",decision_id="D1",approved=True)["approved"])
   except ValueError:results.append(False)
   finally:db.close()
  threads=[threading.Thread(target=worker) for _ in range(2)]
  for t in threads:t.start()
  barrier.wait(timeout=5)
  for t in threads:t.join(timeout=10)
  self.assertFalse(any(t.is_alive() for t in threads))
  self.assertEqual(results.count(True),1)
  self.assertEqual(results.count(False),1)
if __name__=="__main__":unittest.main()
