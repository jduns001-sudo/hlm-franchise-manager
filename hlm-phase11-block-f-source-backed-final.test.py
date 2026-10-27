"""Block F: source-backed deterministic score committed with isolated SQLite season."""
import importlib.util
import json
import sqlite3
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).parent

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

previous = load("block_f_previous", "hlm-phase11-block-e-guarded-synthetic-day.test.py")
day_module = load("block_f_coordinator", "hlm-phase11-block-e-guarded-synthetic-day.py")


class SourceBackedFinalAcceptance(previous.GuardedDayIntegration):
    def setUp(self):
        super().setUp()
        self.day = day_module.GuardedSyntheticSeasonDay(self.lab, source_backed=True)
        self.day_request["seed"] = 27

    def expected(self):
        game = self.original["season"]["games"][1]
        completed = subprocess.run(
            ["node", str(ROOT / "hlm-phase11-block-f-score-adapter.js")],
            input=json.dumps({"gameId": game["id"], "homeTeamId": game["home"],
                              "awayTeamId": game["away"], "seed": 27}),
            capture_output=True, text=True, check=True
        )
        return json.loads(completed.stdout)

    def test_source_backed_final_is_atomic_and_reloads(self):
        expected = self.expected()
        self.assertTrue(self.day.advance(**self.day_request)["committed"])
        revision, state = self.state()
        game = state["season"]["games"][1]
        self.assertEqual(revision, 2)
        for key, value in expected.items():
            self.assertEqual(game[key], value)
        self.assertEqual(state["season"]["day"], 18)
        self.assertEqual(state["history"], self.original["history"])
        self.assertEqual(state["assets"], self.original["assets"])
        saved = self.snapshot_all()
        self.db.close()
        self.db = sqlite3.connect(self.path, isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.lab._db = self.db
        self.day._db = self.db
        self.assertEqual(self.snapshot_all(), saved)
        self.assertFalse(self.day.advance(**self.day_request)["committed"])
        self.assertEqual(self.snapshot_all(), saved)

    def test_source_result_is_deterministic_and_not_caller_supplied(self):
        expected = self.expected()
        before = self.snapshot_all()
        for changes in (
            {"approved": False}, {"cancelled": True}, {"declined": True},
            {"enabled": False}, {"revision": 0}, {"seed": -1},
        ):
            self.assertFalse(self.day.advance(**dict(self.day_request, **changes))["committed"])
            self.assertEqual(self.snapshot_all(), before)
        self.assertTrue(self.day.advance(
            **dict(self.day_request, score={"homeGoals": 99, "awayGoals": 0},
                   game_state={"season": {"day": 999}}, productionSaved=True)
        )["committed"])
        _, state = self.state()
        self.assertEqual(state["season"]["games"][1]["homeGoals"], expected["homeGoals"])
        self.assertEqual(state["season"]["games"][1]["awayGoals"], expected["awayGoals"])
        self.assertNotEqual(state["season"]["day"], 999)

    def test_source_result_rollbacks_and_settlement_share_revision(self):
        before = self.snapshot_all()
        for point in ("state", "decision"):
            self.assertFalse(self.day.advance(**self.day_request, fail_at=point)["committed"])
            self.assertEqual(self.snapshot_all(), before)
        self.assertTrue(self.lab.settle(**self.request)["committed"])
        self.assertFalse(self.day.advance(**self.day_request)["committed"])
        self.assertTrue(self.day.advance(**dict(self.day_request, revision=2))["committed"])
        revision, state = self.state()
        self.assertEqual(revision, 3)
        self.assertEqual(state["universe"]["players"][0]["teamId"], "B")
        self.assertEqual(state["season"]["games"][1]["homeGoals"], self.expected()["homeGoals"])
        self.assertEqual(state["history"], self.original["history"])


if __name__ == "__main__":
    unittest.main()
