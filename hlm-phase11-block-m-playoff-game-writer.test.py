"""Isolated playoff final writer and source-backed reader integration tests."""
import importlib.util
import json
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
ROOT=Path(__file__).parent
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,ROOT/path)
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
writer_mod=load("playoff_writer","hlm-phase11-block-m-playoff-game-writer.py")
reader_mod=load("playoff_reader","hlm-phase11-block-m-sqlite-playoff-provenance.py")
class PlayoffWriterAcceptance(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.path=str(Path(self.tmp.name)/"isolated.sqlite")
  self.db=sqlite3.connect(self.path,isolation_level=None,timeout=5)
  self.db.execute("CREATE TABLE block_a_lab_franchises (franchise_id TEXT PRIMARY KEY,state_revision INTEGER,game_state_json TEXT)")
  self.game={"gameId":"P1","status":"final","homeTeamId":"A","awayTeamId":"B","winnerTeamId":"A"}
  self.state={"extensions":{"phase10Playoffs":{"rounds":[[{"games":[self.game]}]]}}}
  self.db.execute("INSERT INTO block_a_lab_franchises VALUES (?,?,?)",("F",3,json.dumps(self.state)))
  self.session=object()
  self.proof={"authenticated":True,"approvedByGM":True,"committed":True,"game":self.game}
  self.args=dict(session=self.session,franchise="F",revision=3,game_id="P1",review_id="R1",decision_id="D1")
  self.writer=self.build(self.db)
 def build(self,db):
  def auth(s):
   if s is not self.session:raise PermissionError("forged-session")
   return {"gm":"GM","session_id":"SERVER-SESSION"}
  def owner(g,f):
   row=db.execute("SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",(f,)).fetchone()
   return {"owner_gm":"GM","franchise":"F","revision":row[0] if row else None}
  return writer_mod.GuardedPlayoffGameWriter(db,session_verifier=auth,ownership_resolver=owner,
     committed_game_verifier=lambda *args:self.proof,enabled=True)
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def reader(self,db):
  return reader_mod.SQLitePlayoffGameProvenance(db,franchise="F",gm="GM",revision=3,enabled=True)
 def test_atomic_rollback_replay_reload_and_reader(self):
  self.assertFalse(self.writer.record(**self.args,fail_at="before-commit",approved=True)["committed"])
  self.assertFalse(self.reader(self.db).verify("P1",{})["authenticated"])
  self.assertTrue(self.writer.record(**self.args,approved=True)["committed"])
  self.assertTrue(self.reader(self.db).verify("P1",{})["authenticated"])
  self.assertFalse(self.writer.record(**self.args,approved=True)["committed"])
  self.db.close();self.db=sqlite3.connect(self.path,isolation_level=None)
  self.assertTrue(self.reader(self.db).verify("P1",{})["authenticated"])
 def test_forgery_decline_stale_revision_and_game_mismatch(self):
  with self.assertRaises(PermissionError):
   self.writer.record(**dict(self.args,session={"gm":"GM"}),approved=True)
  self.assertFalse(self.writer.record(**self.args,approved=False)["committed"])
  self.proof=dict(self.proof,game=dict(self.game,winnerTeamId="B"))
  self.assertFalse(self.writer.record(**self.args,approved=True)["committed"])
  self.proof=dict(self.proof,game=self.game,approvedByGM=False)
  self.assertFalse(self.writer.record(**self.args,approved=True)["committed"])
  self.proof=dict(self.proof,approvedByGM=True)
  self.db.execute("UPDATE block_a_lab_franchises SET state_revision=4")
  self.assertFalse(self.writer.record(**self.args,approved=True)["committed"])
 def test_competing_connections_exactly_once(self):
  barrier=threading.Barrier(3)
  results=[]
  errors=[]
  def worker():
   db=sqlite3.connect(self.path,isolation_level=None,timeout=5)
   try:
    writer=self.build(db)
    barrier.wait(timeout=5)
    results.append(writer.record(**self.args,approved=True))
   except BaseException as exc:errors.append(str(exc))
   finally:db.close()
  threads=[threading.Thread(target=worker) for _ in range(2)]
  for thread in threads:thread.start()
  barrier.wait(timeout=5)
  for thread in threads:thread.join(timeout=12)
  self.assertFalse(any(thread.is_alive() for thread in threads))
  self.assertEqual(errors,[])
  self.assertEqual(sum(x["committed"] for x in results),1)
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_m_authoritative_playoff_game_settlements").fetchone()[0],1)
 def test_wrapped_review_consumer_rejects_rotated_session(self):
  # The callback name is not a security credential. This must fail closed.
  self.db.execute("""CREATE TABLE block_m_playoff_reviews (
   review_id TEXT PRIMARY KEY, franchise TEXT, session_id TEXT)""")
  self.db.execute("INSERT INTO block_m_playoff_reviews VALUES (?,?,?)",("R1","F","OTHER-SESSION"))
  def wrapped_review_consumer(*args):
   return self.proof
  self.writer.game_source=wrapped_review_consumer
  before=self.db.total_changes
  outcome=self.writer.record(**self.args,approved=True)
  self.assertFalse(outcome["committed"])
  self.assertEqual(self.db.execute(
   "SELECT COUNT(*) FROM sqlite_master WHERE name='block_m_authoritative_playoff_game_settlements'").fetchone()[0],0)
if __name__=="__main__":unittest.main()
