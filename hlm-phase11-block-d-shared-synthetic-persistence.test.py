"""Block D: test-only shared SQLite franchise state and settlement acceptance.

Uses the existing authenticated settlement lab and the same authoritative SQLite
franchise JSON for season and asset data. No production database or save access.
"""
import copy
import json
import sqlite3
import unittest
import importlib.util
from pathlib import Path

ROOT = Path(__file__).parent
spec = importlib.util.spec_from_file_location(
    "block_d_existing_fixture", ROOT / "hlm-phase11-block-a-authenticated-sqlite-lab.test.py"
)
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)


class SharedExperimentalFranchiseAcceptance(fixture.AuthenticatedSqliteTests):
    def setUp(self):
        super().setUp()
        self.original["season"] = {
            "id": "SYNTHETIC-2026", "day": 17,
            "games": [{"id": "SYNTHETIC-G1", "status": "final", "home": "A", "away": "B"}],
            "standings": [{"teamId": "A", "points": 8}, {"teamId": "B", "points": 6}],
        }
        self.original["history"]["seasons"].append({"season": "SYNTHETIC-2025", "champion": "A"})
        self.db.execute(
            "UPDATE block_a_lab_franchises SET game_state_json=? WHERE franchise_id=?",
            (json.dumps(self.original), "SYNTHETIC-F")
        )

    def state(self):
        revision, raw = self.db.execute(
            "SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",
            ("SYNTHETIC-F",)
        ).fetchone()
        return revision, json.loads(raw)

    def test_approved_settlement_and_reopen_share_one_season_and_asset_state(self):
        self.assertTrue(self.lab.settle(**self.request)["committed"])
        revision, state = self.state()
        self.assertEqual(revision, 2)
        self.assertEqual(state["season"], self.original["season"])
        self.assertEqual(state["history"], self.original["history"])
        self.assertEqual([
            state["universe"]["players"][0]["teamId"],
            state["assets"]["contracts"][0]["teamId"],
            state["assets"]["draftPicks"][0]["currentOwnerId"],
            state["universe"]["prospects"][0]["rightsTeamId"],
        ], ["B"] * 4)
        self.assertEqual(len(state["activity"]["transactions"]), 1)
        committed = self.snapshot()
        self.db.close()
        self.db = sqlite3.connect(self.path, isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.lab._db = self.db
        self.assertEqual(self.snapshot(), committed)
        self.assertEqual(self.state(), (revision, state))
        self.assertFalse(self.lab.settle(**self.request)["committed"])
        self.assertEqual(self.snapshot(), committed)

    def test_cancel_decline_disabled_and_stale_are_no_save(self):
        before = self.snapshot()
        for overrides in (
            {"approved": False}, {"cancelled": True}, {"declined": True},
            {"enabled": False}, {"revision": 0},
        ):
            self.assertFalse(self.lab.settle(**dict(self.request, **overrides))["committed"])
            self.assertEqual(self.snapshot(), before)
        other = sqlite3.connect(self.path, isolation_level=None)
        try:
            self.assertEqual(other.execute(
                "SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",
                ("SYNTHETIC-F",)
            ).fetchone()[0], 1)
            self.assertTrue(self.lab.settle(**self.request)["committed"])
            self.assertFalse(self.lab.settle(**self.request)["committed"])
            self.assertEqual(other.execute(
                "SELECT state_revision FROM block_a_lab_franchises WHERE franchise_id=?",
                ("SYNTHETIC-F",)
            ).fetchone()[0], 2)
        finally:
            other.close()

    def test_failure_injection_preserves_entire_franchise_and_sqlite_ledgers(self):
        before = self.snapshot()
        for stage in ("state", "replay", "history"):
            self.assertFalse(self.lab.settle(**self.request, fail_at=stage)["committed"])
            self.assertEqual(self.snapshot(), before)
        self.assertEqual(self.state(), (1, self.original))
        self.assertTrue(self.lab.settle(**self.request)["committed"])

    def test_untrusted_payload_cannot_replace_season_or_production_state(self):
        forged = {"season": {"day": 9999}, "history": {"seasons": []}}
        result = self.lab.settle(**self.request, state=forged, game_state=forged,
                                 productionSaved=True)
        self.assertTrue(result["committed"])
        self.assertFalse(result["productionSaved"])
        _, state = self.state()
        self.assertEqual(state["season"], self.original["season"])
        self.assertEqual(state["history"], self.original["history"])
        self.assertNotIn("9999", json.dumps(state))


if __name__ == "__main__":
    unittest.main()
