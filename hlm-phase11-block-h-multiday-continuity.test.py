"""Block H: consecutive GM-approved synthetic days retain cumulative standings."""
import importlib.util
import json
import sqlite3
import unittest
from pathlib import Path

ROOT=Path(__file__).parent
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
previous=load("block_h_prior","hlm-phase11-block-g-multigame-standings.test.py")

class MultiDayStandingsContinuity(previous.MultiGameStandingsAcceptance):
    def setUp(self):
        super().setUp()
        # Place later fixtures ahead of earlier ones to test chronological selection.
        self.original["season"]["games"].insert(1,{"id":"SYNTHETIC-G5","status":"scheduled","home":"B","away":"D","date":"2026-10-20"})
        self.db.execute("UPDATE block_a_lab_franchises SET game_state_json=? WHERE franchise_id=?",
                        (json.dumps(self.original),"SYNTHETIC-F"))

    def test_three_days_cumulative_standings_one_revision_each(self):
        day=self.multiday()
        expected=[(2,18,6),(3,19,8),(4,20,10)]
        for index,(revision,season_day,total_gp) in enumerate(expected):
            request=dict(self.day_request,revision=revision-1,
                         decision_id="SYNTHETIC-DAY-"+str(18+index))
            self.assertTrue(day.advance(**request)["committed"])
            actual,state=self.state()
            self.assertEqual(actual,revision)
            self.assertEqual(state["season"]["day"],season_day)
            self.assertEqual(sum(row["gp"] for row in state["season"]["standings"]),total_gp)
            self.assertEqual(state["history"],self.original["history"])
            self.assertEqual(len(state["season"]["completedDayDecisions"]),index+1)
            self.assertEqual(len([g for g in state["season"]["games"] if g["status"]=="scheduled"]),3-index)
            before=self.snapshot_all()
            self.assertFalse(day.advance(**request)["committed"])
            self.assertEqual(self.snapshot_all(),before)
        before=self.snapshot_all()
        self.db.close()
        self.db=sqlite3.connect(self.path,isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.lab._db=self.db
        day._db=self.db
        self.assertEqual(self.snapshot_all(),before)

    def test_second_day_cancellation_failure_and_stale_no_save(self):
        day=self.multiday()
        self.assertTrue(day.advance(**self.day_request)["committed"])
        before=self.snapshot_all()
        request=dict(self.day_request,revision=2,decision_id="SYNTHETIC-DAY-19")
        for changes in ({"cancelled":True},{"declined":True},{"approved":False},
                        {"enabled":False},{"revision":1},{"seed":-1}):
            self.assertFalse(day.advance(**dict(request,**changes))["committed"])
            self.assertEqual(self.snapshot_all(),before)
        for stage in ("state","decision"):
            self.assertFalse(day.advance(**request,fail_at=stage)["committed"])
            self.assertEqual(self.snapshot_all(),before)
        self.assertTrue(day.advance(**request)["committed"])
        self.assertEqual(self.state()[0],3)

    def test_multiday_after_settlement_preserves_assets_and_history(self):
        day=self.multiday()
        self.assertTrue(self.lab.settle(**self.request)["committed"])
        for revision,decision in ((2,"SYNTHETIC-DAY-18"),(3,"SYNTHETIC-DAY-19")):
            self.assertTrue(day.advance(**dict(self.day_request,revision=revision,
                                              decision_id=decision,productionSaved=True,
                                              standings=[{"teamId":"A","points":999}]))["committed"])
        revision,state=self.state()
        self.assertEqual(revision,4)
        self.assertEqual(state["universe"]["players"][0]["teamId"],"B")
        self.assertEqual(state["assets"]["contracts"][0]["teamId"],"B")
        self.assertEqual(state["history"],self.original["history"])
        self.assertEqual(len(state["activity"]["transactions"]),1)
        self.assertNotEqual(state["season"]["standings"][0]["points"],999)

if __name__=="__main__":
    unittest.main()
