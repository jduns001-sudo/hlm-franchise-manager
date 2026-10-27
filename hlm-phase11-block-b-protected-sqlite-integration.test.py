"""Block B: isolated authenticated SQLite settlement regression tests only.

This module deliberately imports the existing test-only lab and never production code.
"""
import copy
import importlib.util
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).parent
spec = importlib.util.spec_from_file_location("block_a_authenticated_tests", ROOT / "hlm-phase11-block-a-authenticated-sqlite-lab.test.py")
existing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(existing)


class ProtectedSettlementIntegrationTests(existing.AuthenticatedSqliteTests):
    def test_linked_transaction_history_and_provenance_are_durable(self):
        result = self.lab.settle(**self.request)
        self.assertTrue(result["committed"])
        revision, raw = self.db.execute(
            "SELECT state_revision, game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",
            ("SYNTHETIC-F",)
        ).fetchone()
        state = json.loads(raw)
        self.assertEqual(revision, 2)
        self.assertEqual(state["activity"]["transactions"], [{"decision": self.cpu["id"], "synthetic": True}])
        history = self.db.execute(
            "SELECT decision_id, previous_revision, next_revision, asset_delta_json "
            "FROM block_a_lab_transaction_history WHERE franchise_id=?", ("SYNTHETIC-F",)
        ).fetchone()
        self.assertEqual(history[:3], (self.cpu["id"], 1, 2))
        self.assertEqual(json.loads(history[3]), {"synthetic": True, "linked": 4})
        self.assertEqual(state["history"]["seasons"], self.original["history"]["seasons"])
        self.assertFalse(result["productionSaved"])

    def test_reopened_sqlite_rejects_replay_without_mutation(self):
        self.assertTrue(self.lab.settle(**self.request)["committed"])
        committed = self.snapshot()
        self.db.close()
        self.db = sqlite3.connect(self.path, isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.lab._db = self.db
        self.assertEqual(self.snapshot(), committed)
        self.assertFalse(self.lab.settle(**self.request)["committed"])
        self.assertEqual(self.snapshot(), committed)

    def test_untrusted_payload_cannot_replace_authoritative_state(self):
        before = copy.deepcopy(self.original)
        forged = {"universe": {"players": [{"id": "SYNTHETIC-P", "teamId": "ATTACKER"}]},
                  "history": {"seasons": []}}
        result = self.lab.settle(**self.request, game_state=forged,
                                 state=forged, productionSaved=True,
                                 arbitrary_signer=lambda *_: True)
        self.assertTrue(result["committed"])
        self.assertFalse(result["productionSaved"])
        state = json.loads(self.snapshot()[0][0][1])
        self.assertEqual(state["universe"]["players"][0]["teamId"], "B")
        self.assertEqual(state["history"]["seasons"], before["history"]["seasons"])
        self.assertNotIn("ATTACKER", json.dumps(state))

    def test_failure_then_cancel_then_retry_preserves_atomicity(self):
        initial = self.snapshot()
        for stage in ("state", "replay", "history"):
            self.assertFalse(self.lab.settle(**self.request, fail_at=stage)["committed"])
            self.assertEqual(self.snapshot(), initial)
        for key in ("cancelled", "declined"):
            self.assertFalse(self.lab.settle(**dict(self.request, **{key: True}))["committed"])
            self.assertEqual(self.snapshot(), initial)
        self.assertTrue(self.lab.settle(**self.request)["committed"])
        self.assertEqual(len(self.snapshot()[1]), 1)
        self.assertEqual(len(self.snapshot()[2]), 1)


if __name__ == "__main__":
    import unittest
    unittest.main()
