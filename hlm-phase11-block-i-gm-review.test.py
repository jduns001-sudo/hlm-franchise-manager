"""Block I: exact GM review authorization, replay rejection and rollback."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parent
spec = importlib.util.spec_from_file_location("block_i_prior", ROOT / "hlm-phase11-block-h-multiday-continuity.test.py")
prior = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prior)

class ReviewedMultiDayAcceptance(prior.MultiDayStandingsContinuity):
    def reviewed(self):
        return prior.previous.previous.coordinator.GuardedSyntheticSeasonDay(
            self.lab, source_backed=True, multi_game=True, review_required=True)

    def approve(self, day, revision=1, seed=17, decision_id="SYNTHETIC-DAY-18"):
        request = dict(self.day_request, revision=revision, seed=seed, decision_id=decision_id)
        review = day.prepare_review(gm=request["gm"], franchise=request["franchise"],
                                    revision=revision, seed=seed)
        return request, review

    def test_reviewed_three_days_and_reload(self):
        day = self.reviewed()
        for rev in (1, 2, 3):
            request, review = self.approve(day, revision=rev, decision_id="SYNTHETIC-DAY-"+str(17+rev))
            self.assertEqual(review["plan"]["revision"], rev)
            self.assertTrue(day.advance(**request, review_id=review["review_id"])["committed"])
            before = self.snapshot_all()
            self.assertFalse(day.advance(**request, review_id=review["review_id"])["committed"])
            self.assertEqual(self.snapshot_all(), before)
        self.assertEqual(self.state()[0], 4)
        self.assertEqual(sum(x["gp"] for x in self.state()[1]["season"]["standings"]), 10)

    def test_unreviewed_forged_changed_and_cancelled_no_save(self):
        day = self.reviewed()
        request, review = self.approve(day)
        before = self.snapshot_all()
        for changes in ({"review_id":"forged"}, {"review_id":None},
                        {"review_id":review["review_id"],"seed":18},
                        {"review_id":review["review_id"],"approved":False},
                        {"review_id":review["review_id"],"cancelled":True},
                        {"review_id":review["review_id"],"declined":True},
                        {"review_id":review["review_id"],"revision":0}):
            self.assertFalse(day.advance(**dict(request,**changes))["committed"])
            self.assertEqual(self.snapshot_all(), before)
        self.assertTrue(day.advance(**request,review_id=review["review_id"])["committed"])

    def test_injected_failure_rolls_back_review_consumption(self):
        day = self.reviewed()
        request, review = self.approve(day)
        for stage in ("state","decision"):
            before = self.snapshot_all()
            self.assertFalse(day.advance(**request,review_id=review["review_id"],fail_at=stage)["committed"])
            self.assertEqual(self.snapshot_all(),before)
        self.assertTrue(day.advance(**request,review_id=review["review_id"])["committed"])

    def test_stale_review_after_other_commit(self):
        day = self.reviewed()
        request, review = self.approve(day)
        other = dict(request,decision_id="SYNTHETIC-DAY-OTHER")
        second = day.prepare_review(gm=request["gm"],franchise=request["franchise"],
                                    revision=1,seed=request["seed"])
        self.assertTrue(day.advance(**other,review_id=second["review_id"])["committed"])
        before = self.snapshot_all()
        self.assertFalse(day.advance(**request,review_id=review["review_id"])["committed"])
        self.assertEqual(self.snapshot_all(),before)

if __name__ == "__main__":
    unittest.main()
