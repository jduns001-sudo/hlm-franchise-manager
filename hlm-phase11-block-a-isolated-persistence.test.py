"""Isolated SQLite proof of durable CAS, replay rejection and atomic rollback.
All game data is synthetic lab-only; this does not authenticate CPU consent.
"""
import json
import sqlite3
import unittest
from pathlib import Path

SCHEMA = Path(__file__).with_name("hlm-phase11-block-a-isolated-persistence.sql").read_text()

class PersistenceLab(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript(SCHEMA)
        self.original = {
            "universe": {"players": [{"id": "SYNTHETIC-P", "teamId": "A"}],
                         "prospects": [{"id": "SYNTHETIC-R", "rightsTeamId": "A"}]},
            "assets": {"contracts": [{"playerId": "SYNTHETIC-P", "teamId": "A"}],
                       "draftPicks": [{"pickId": "SYNTHETIC-K", "currentOwnerId": "A"}]},
            "history": {"seasons": [{"id": "SYNTHETIC-OLD-SEASON"}]},
            "activity": {"transactions": []},
        }
        self.db.execute("INSERT INTO block_a_lab_franchises(franchise_id,state_revision,game_state_json) VALUES (?,?,?)",
                        ("lab-only", 1, json.dumps(self.original)))
        self.db.commit()

    def snapshot(self):
        row = self.db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id='lab-only'").fetchone()
        return (row, self.db.execute("SELECT count(*) FROM block_a_lab_consumed_decisions").fetchone()[0],
                self.db.execute("SELECT count(*) FROM block_a_lab_transaction_history").fetchone()[0])

    def commit_lab(self, decision, expected, fail_at=None):
        if decision is None:
            raise ValueError("No independently authenticated decision")
        row = self.db.execute("SELECT game_state_json FROM block_a_lab_franchises WHERE franchise_id='lab-only'").fetchone()
        state = json.loads(row[0])
        state["universe"]["players"][0]["teamId"] = "B"
        state["assets"]["contracts"][0]["teamId"] = "B"
        state["assets"]["draftPicks"][0]["currentOwnerId"] = "B"
        state["universe"]["prospects"][0]["rightsTeamId"] = "B"
        state["activity"]["transactions"].append({"id": decision, "synthetic": True})
        try:
            with self.db:
                cursor = self.db.execute(
                    "UPDATE block_a_lab_franchises SET state_revision=?,game_state_json=? WHERE franchise_id=? AND state_revision=?",
                    (expected + 1, json.dumps(state), "lab-only", expected))
                if cursor.rowcount != 1:
                    raise ValueError("stale-revision")
                if fail_at == "after_state":
                    raise ValueError("injected-failure")
                self.db.execute(
                    "INSERT INTO block_a_lab_consumed_decisions(decision_id,franchise_id,proposal_digest,previous_revision,next_revision) VALUES (?,?,?,?,?)",
                    (decision, "lab-only", "synthetic-digest", expected, expected + 1))
                if fail_at == "after_replay":
                    raise ValueError("injected-failure")
                self.db.execute(
                    "INSERT INTO block_a_lab_transaction_history(transaction_id,franchise_id,decision_id,previous_revision,next_revision,asset_delta_json) VALUES (?,?,?,?,?,?)",
                    ("history-" + decision, "lab-only", decision, expected, expected + 1, json.dumps({"synthetic": True})))
        except Exception:
            raise

    def test_all_four_assets_history_and_replay_are_durable(self):
        self.commit_lab("synthetic-consent-1", 1)
        revision, raw = self.snapshot()[0]
        state = json.loads(raw)
        self.assertEqual(revision, 2)
        self.assertEqual([state["universe"]["players"][0]["teamId"],
                          state["assets"]["contracts"][0]["teamId"],
                          state["assets"]["draftPicks"][0]["currentOwnerId"],
                          state["universe"]["prospects"][0]["rightsTeamId"]], ["B"] * 4)
        self.assertEqual(state["history"]["seasons"], self.original["history"]["seasons"])
        self.assertEqual(self.snapshot()[1:], (1, 1))
        with self.assertRaises((ValueError, sqlite3.IntegrityError)):
            self.commit_lab("synthetic-consent-1", 2)
        self.assertEqual(self.snapshot()[1:], (1, 1))

    def test_stale_revision_and_injected_failures_rollback_everything(self):
        before = self.snapshot()
        with self.assertRaises(ValueError):
            self.commit_lab("stale", 0)
        self.assertEqual(self.snapshot(), before)
        for point in ("after_state", "after_replay"):
            with self.assertRaises(ValueError):
                self.commit_lab("synthetic-" + point, 1, fail_at=point)
            self.assertEqual(self.snapshot(), before)

    def tearDown(self):
        self.db.close()

if __name__ == "__main__":
    unittest.main()
