"""Block E: GM-approved synthetic day and transaction share one SQLite franchise."""
import copy
import importlib.util
import json
import sqlite3
import unittest
from pathlib import Path

ROOT = Path(__file__).parent

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

base = load("block_e_fixture", "hlm-phase11-block-d-shared-synthetic-persistence.test.py")
day_module = load("block_e_day", "hlm-phase11-block-e-guarded-synthetic-day.py")


class GuardedDayIntegration(base.SharedExperimentalFranchiseAcceptance):
    def setUp(self):
        super().setUp()
        self.original["season"]["games"].append({
            "id": "SYNTHETIC-G2", "status": "scheduled", "home": "A", "away": "B"
        })
        self.db.execute(
            "UPDATE block_a_lab_franchises SET game_state_json=? WHERE franchise_id=?",
            (json.dumps(self.original), "SYNTHETIC-F")
        )
        self.day = day_module.GuardedSyntheticSeasonDay(self.lab)
        self.day_request = dict(
            gm=self.gm, franchise="SYNTHETIC-F", revision=1,
            decision_id="SYNTHETIC-DAY-18", approved=True, enabled=True
        )

    def snapshot_all(self):
        return self.snapshot() + (
            self.db.execute("SELECT * FROM block_e_lab_consumed_days").fetchall(),
        )

    def test_gm_day_then_transaction_share_revision_and_reopen(self):
        self.assertTrue(self.day.advance(**self.day_request)["committed"])
        revision, state = self.state()
        self.assertEqual(revision, 2)
        self.assertEqual(state["season"]["day"], 18)
        self.assertEqual(state["season"]["games"][1]["status"], "final")
        self.assertEqual(state["history"], self.original["history"])
        self.assertEqual(state["assets"], self.original["assets"])
        self.assertFalse(self.lab.settle(**self.request)["committed"])
        next_cpu = self.lab.issue_cpu("SYNTHETIC-F", 2, "SYNTHETIC-DIGEST-2")
        next_request = dict(self.request, revision=2, digest="SYNTHETIC-DIGEST-2", cpu=next_cpu)
        self.assertTrue(self.lab.settle(**next_request)["committed"])
        revision, state = self.state()
        self.assertEqual(revision, 3)
        self.assertEqual(state["season"]["day"], 18)
        self.assertEqual(state["universe"]["players"][0]["teamId"], "B")
        self.assertEqual(state["history"], self.original["history"])
        committed = self.snapshot_all()
        self.db.close()
        self.db = sqlite3.connect(self.path, isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.lab._db = self.db
        self.day._db = self.db
        self.assertEqual(self.snapshot_all(), committed)
        self.assertFalse(self.day.advance(**self.day_request)["committed"])
        self.assertFalse(self.lab.settle(**next_request)["committed"])
        self.assertEqual(self.snapshot_all(), committed)

    def test_cancel_decline_disabled_untrusted_and_stale_never_save(self):
        before = self.snapshot_all()
        for overrides in (
            {"approved": False}, {"cancelled": True}, {"declined": True},
            {"enabled": False}, {"revision": 0},
            {"gm": {"token": "fake", "gm": "SYNTHETIC-GM", "proof": "fake"}},
        ):
            self.assertFalse(self.day.advance(**dict(self.day_request, **overrides))["committed"])
            self.assertEqual(self.snapshot_all(), before)
        self.assertTrue(self.day.advance(
            **dict(self.day_request, state={"season": {"day": 9999}},
                   productionSaved=True)
        )["committed"])
        self.assertEqual(self.state()[1]["season"]["day"], 18)
        self.assertFalse(self.day.advance(**self.day_request)["committed"])

    def test_injected_failure_rolls_back_day_and_consumption(self):
        before = self.snapshot_all()
        for stage in ("state", "decision"):
            self.assertFalse(self.day.advance(**self.day_request, fail_at=stage)["committed"])
            self.assertEqual(self.snapshot_all(), before)
        self.assertTrue(self.day.advance(**self.day_request)["committed"])

    def test_settlement_first_then_day_uses_updated_revision(self):
        self.assertTrue(self.lab.settle(**self.request)["committed"])
        self.assertFalse(self.day.advance(**self.day_request)["committed"])
        request = dict(self.day_request, revision=2)
        self.assertTrue(self.day.advance(**request)["committed"])
        revision, state = self.state()
        self.assertEqual(revision, 3)
        self.assertEqual(state["season"]["day"], 18)
        self.assertEqual(state["universe"]["players"][0]["teamId"], "B")
        self.assertEqual(len(state["activity"]["transactions"]), 1)


if __name__ == "__main__":
    unittest.main()
