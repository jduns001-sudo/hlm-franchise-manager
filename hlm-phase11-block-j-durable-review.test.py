"""Block J: durable review recovery and cross-session no-double-advance."""
import importlib.util
import sqlite3
import unittest
from pathlib import Path

ROOT=Path(__file__).parent
spec=importlib.util.spec_from_file_location("block_j_prior",ROOT/"hlm-phase11-block-i-gm-review.test.py")
prior=importlib.util.module_from_spec(spec)
spec.loader.exec_module(prior)

class DurableReviewRecovery(prior.ReviewedMultiDayAcceptance):
    def test_reload_recovers_pending_then_consumed(self):
        day=self.reviewed()
        request,review=self.approve(day)
        token=review["review_id"]
        self.assertEqual(day.recover_review(gm=request["gm"],franchise=request["franchise"],review_id=token)["status"],"pending")
        self.db.close()
        self.db=sqlite3.connect(self.path,isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.lab._db=self.db
        day=self.reviewed()
        self.assertEqual(day.recover_review(gm=request["gm"],franchise=request["franchise"],review_id=token)["status"],"pending")
        self.assertTrue(day.advance(**request,review_id=token)["committed"])
        recovered=day.recover_review(gm=request["gm"],franchise=request["franchise"],review_id=token)
        self.assertEqual(recovered["status"],"consumed")
        self.assertEqual(recovered["decision_id"],request["decision_id"])
        before=self.snapshot_all()
        self.assertFalse(day.advance(**request,review_id=token)["committed"])
        self.assertEqual(self.snapshot_all(),before)

    def test_cross_session_and_wrong_franchise_rejected(self):
        day=self.reviewed()
        request,review=self.approve(day)
        other=dict(request["gm"],token="other-session",proof="other-proof")
        self.lab._gm_sessions[other["token"]]=(request["franchise"],other["gm"],other["proof"])
        with self.assertRaises(ValueError):
            day.recover_review(gm=other,franchise=request["franchise"],review_id=review["review_id"])
        before=self.snapshot_all()
        self.assertFalse(day.advance(**dict(request,gm=other),review_id=review["review_id"])["committed"])
        self.assertEqual(self.snapshot_all(),before)
        with self.assertRaises(ValueError):
            day.recover_review(gm=request["gm"],franchise="OTHER",review_id=review["review_id"])
        self.assertTrue(day.advance(**request,review_id=review["review_id"])["committed"])

    def test_two_reviewers_same_revision_only_one_commit(self):
        day=self.reviewed()
        request,first=self.approve(day)
        second=day.prepare_review(gm=request["gm"],franchise=request["franchise"],revision=1,seed=17)
        self.assertTrue(day.advance(**request,review_id=first["review_id"])["committed"])
        before=self.snapshot_all()
        self.assertFalse(day.advance(**dict(request,decision_id="SYNTHETIC-DAY-OTHER"),
                                     review_id=second["review_id"])["committed"])
        self.assertEqual(self.snapshot_all(),before)
        self.assertEqual(day.recover_review(gm=request["gm"],franchise=request["franchise"],
                                          review_id=second["review_id"])["status"],"stale")

    def test_failure_rolls_back_decision_and_review(self):
        day=self.reviewed()
        request,review=self.approve(day)
        for stage in ("state","decision"):
            before=self.snapshot_all()
            self.assertFalse(day.advance(**request,review_id=review["review_id"],fail_at=stage)["committed"])
            self.assertEqual(self.snapshot_all(),before)
            self.assertEqual(day.recover_review(gm=request["gm"],franchise=request["franchise"],
                                              review_id=review["review_id"])["status"],"pending")
        self.assertTrue(day.advance(**request,review_id=review["review_id"])["committed"])

if __name__=="__main__":
    unittest.main()
