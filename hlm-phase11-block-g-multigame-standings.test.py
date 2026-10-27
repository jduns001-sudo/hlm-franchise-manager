"""Block G: multiple source-backed finals and standings in one guarded SQLite day."""
import importlib.util
import json
import sqlite3
import subprocess
import unittest
from pathlib import Path

ROOT=Path(__file__).parent
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

prior=load("block_g_prior","hlm-phase11-block-f-source-backed-final.test.py")
coordinator=load("block_g_day","hlm-phase11-block-e-guarded-synthetic-day.py")


class MultiGameStandingsAcceptance(prior.SourceBackedFinalAcceptance):
    def setUp(self):
        super().setUp()
        self.original["universe"]["teams"]=[
            {"id":"A","name":"Alpha"},{"id":"B","name":"Beta"},
            {"id":"C","name":"Gamma"},{"id":"D","name":"Delta"}]
        games=self.original["season"]["games"]
        games[0].update({"homeGoals":3,"awayGoals":2,"overtime":True})
        games[1]["date"]="2026-10-18"
        games.append({"id":"SYNTHETIC-G3","status":"scheduled","home":"C","away":"D","date":"2026-10-18"})
        games.append({"id":"SYNTHETIC-G4","status":"scheduled","home":"A","away":"C","date":"2026-10-19"})
        self.db.execute("UPDATE block_a_lab_franchises SET game_state_json=? WHERE franchise_id=?",
                        (json.dumps(self.original),"SYNTHETIC-F"))

    def multiday(self):
        return coordinator.GuardedSyntheticSeasonDay(self.lab,source_backed=True,multi_game=True)

    def test_two_games_one_revision_with_standings_and_future_untouched(self):
        day=self.multiday()
        self.assertTrue(day.advance(**self.day_request)["committed"])
        revision,state=self.state()
        self.assertEqual(revision,2)
        games=state["season"]["games"]
        self.assertEqual([g["status"] for g in games],["final","final","final","scheduled"])
        self.assertEqual(state["season"]["day"],18)
        self.assertEqual(len(state["season"]["standings"]),4)
        for game in games[1:3]:
            self.assertNotEqual(game["homeGoals"],game["awayGoals"])
            self.assertEqual(game["winnerTeamId"],game["home"] if game["homeGoals"]>game["awayGoals"] else game["away"])
        self.assertEqual(sum(row["gp"] for row in state["season"]["standings"]),6)
        self.assertEqual(state["history"],self.original["history"])
        self.assertEqual(state["assets"],self.original["assets"])
        before=self.snapshot_all()
        self.db.close()
        self.db=sqlite3.connect(self.path,isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.lab._db=self.db
        day._db=self.db
        self.assertEqual(self.snapshot_all(),before)
        self.assertFalse(day.advance(**self.day_request)["committed"])
        self.assertEqual(self.snapshot_all(),before)

    def test_multi_game_no_save_and_rollback(self):
        day=self.multiday()
        before=self.snapshot_all()
        for override in ({"approved":False},{"cancelled":True},{"declined":True},
                         {"enabled":False},{"revision":0},{"seed":-1}):
            self.assertFalse(day.advance(**dict(self.day_request,**override))["committed"])
            self.assertEqual(self.snapshot_all(),before)
        for fail_at in ("state","decision"):
            self.assertFalse(day.advance(**self.day_request,fail_at=fail_at)["committed"])
            self.assertEqual(self.snapshot_all(),before)
        self.assertTrue(day.advance(**self.day_request)["committed"])
        self.assertFalse(day.advance(**self.day_request)["committed"])

    def test_multi_game_after_settlement_preserves_ownership_and_history(self):
        day=self.multiday()
        self.assertTrue(self.lab.settle(**self.request)["committed"])
        self.assertFalse(day.advance(**self.day_request)["committed"])
        self.assertTrue(day.advance(**dict(self.day_request,revision=2,
            standings=[{"teamId":"A","points":999}],productionSaved=True))["committed"])
        revision,state=self.state()
        self.assertEqual(revision,3)
        self.assertEqual(state["universe"]["players"][0]["teamId"],"B")
        self.assertEqual(state["assets"]["contracts"][0]["teamId"],"B")
        self.assertEqual(state["history"],self.original["history"])
        self.assertNotEqual(state["season"]["standings"][0]["points"],999)
        self.assertEqual(len(state["activity"]["transactions"]),1)


if __name__=="__main__":
    unittest.main()
