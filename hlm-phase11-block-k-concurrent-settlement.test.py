"""Block K: two independent SQLite connections, exactly-once GM settlement."""
import importlib.util
import sqlite3
import threading
import unittest
from pathlib import Path

ROOT=Path(__file__).parent
spec=importlib.util.spec_from_file_location("block_k_prior",ROOT/"hlm-phase11-block-j-durable-review.test.py")
prior=importlib.util.module_from_spec(spec)
spec.loader.exec_module(prior)

class ConcurrentSettlementAcceptance(prior.DurableReviewRecovery):
    def _second_connection(self):
        connection=sqlite3.connect(self.path,isolation_level=None,timeout=2,check_same_thread=False)
        connection.execute("PRAGMA foreign_keys=ON")
        class SessionLab:
            pass
        other=SessionLab()
        other._db=connection
        other._gm_sessions=self.lab._gm_sessions.copy()
        coordinator=prior.prior.prior.previous.coordinator.GuardedSyntheticSeasonDay(
            other,source_backed=True,multi_game=True,review_required=True)
        return connection,coordinator

    def test_two_connections_compete_same_review(self):
        day=self.reviewed()
        request,review=self.approve(day)
        try:
            barrier=threading.Barrier(3)
            results=[]
            errors=[]
            def settle():
                connection,coordinator=self._second_connection()
                try:
                    barrier.wait(timeout=5)
                    results.append(coordinator.advance(**request,review_id=review["review_id"]))
                except BaseException as exc:
                    errors.append(str(exc))
                finally:
                    connection.close()
            t1=threading.Thread(target=settle)
            t2=threading.Thread(target=settle)
            t1.start();t2.start();barrier.wait(timeout=5)
            t1.join(timeout=15);t2.join(timeout=15)
            self.assertFalse(t1.is_alive() or t2.is_alive())
            self.assertEqual(errors,[])
            self.assertEqual(len(results),2)
            self.assertEqual(sum(bool(r["committed"]) for r in results),1)
            self.assertEqual(self.state()[0],2)
            self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_e_lab_consumed_days").fetchone()[0],1)
            self.assertEqual(self.db.execute("SELECT consumed FROM block_i_lab_reviews WHERE review_id=?",
                                              (review["review_id"],)).fetchone()[0],1)
            self.assertEqual(day.recover_review(gm=request["gm"],franchise=request["franchise"],
                                              review_id=review["review_id"])["status"],"consumed")
        finally:
            pass

    def test_locked_writer_then_retry_and_replay(self):
        day=self.reviewed()
        request,review=self.approve(day)
        connection,other=self._second_connection()
        try:
            self.db.execute("BEGIN IMMEDIATE")
            try:
                # A competing connection must not write through a held lock.
                connection.execute("PRAGMA busy_timeout=50")
                with self.assertRaises(sqlite3.OperationalError):
                    connection.execute("BEGIN IMMEDIATE")
            finally:
                self.db.execute("ROLLBACK")
            self.assertEqual(day.recover_review(gm=request["gm"],franchise=request["franchise"],
                                              review_id=review["review_id"])["status"],"pending")
            self.assertTrue(other.advance(**request,review_id=review["review_id"])["committed"])
            before=self.snapshot_all()
            self.assertFalse(day.advance(**request,review_id=review["review_id"])["committed"])
            self.assertEqual(self.snapshot_all(),before)
        finally:
            connection.close()

    def test_rollback_recovery_across_connections(self):
        day=self.reviewed()
        request,review=self.approve(day)
        connection,other=self._second_connection()
        try:
            for stage in ("state","decision"):
                before=self.snapshot_all()
                self.assertFalse(other.advance(**request,review_id=review["review_id"],fail_at=stage)["committed"])
                self.assertEqual(self.snapshot_all(),before)
                self.assertEqual(day.recover_review(gm=request["gm"],franchise=request["franchise"],
                                                  review_id=review["review_id"])["status"],"pending")
            self.assertTrue(day.advance(**request,review_id=review["review_id"])["committed"])
            self.assertFalse(other.advance(**request,review_id=review["review_id"])["committed"])
        finally:
            connection.close()

if __name__=="__main__":
    unittest.main()
