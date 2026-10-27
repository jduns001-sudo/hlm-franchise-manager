"""Isolated durable SQLite concurrency acceptance. All records are synthetic.
No real GM authorization, CPU signature, or production database is used.
"""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

SCHEMA = Path(__file__).with_name("hlm-phase11-block-a-isolated-persistence.sql").read_text()

class DurableConcurrencyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="hlm-block-a-lab-")
        self.path = str(Path(self.temp.name) / "lab.sqlite3")
        self.a = sqlite3.connect(self.path, timeout=1, isolation_level=None)
        self.b = sqlite3.connect(self.path, timeout=1, isolation_level=None)
        for db in (self.a, self.b):
            db.execute("PRAGMA foreign_keys=ON")
            db.execute("PRAGMA busy_timeout=1000")
        self.a.executescript(SCHEMA)
        self.initial = {"universe":{"players":[{"id":"SYNTHETIC-P","teamId":"A"}],
                                     "prospects":[{"id":"SYNTHETIC-R","rightsTeamId":"A"}]},
                        "assets":{"contracts":[{"playerId":"SYNTHETIC-P","teamId":"A"}],
                                  "draftPicks":[{"pickId":"SYNTHETIC-K","currentOwnerId":"A"}]},
                        "history":{"seasons":[{"season":"SYNTHETIC-OLD-SEASON"}]},
                        "activity":{"transactions":[]}}
        self.a.execute("INSERT INTO block_a_lab_franchises(franchise_id,state_revision,game_state_json) VALUES (?,?,?)",
                       ("SYNTHETIC-FRANCHISE",1,json.dumps(self.initial)))

    def snapshot(self, db):
        return (db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises").fetchone(),
                db.execute("SELECT decision_id FROM block_a_lab_consumed_decisions ORDER BY decision_id").fetchall(),
                db.execute("SELECT transaction_id FROM block_a_lab_transaction_history ORDER BY transaction_id").fetchall())

    def transfer(self, db, expected, decision, fail=None):
        # BEGIN IMMEDIATE serializes competing writers before reading authoritative state.
        db.execute("BEGIN IMMEDIATE")
        try:
            revision, raw = db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises WHERE franchise_id=?",
                                       ("SYNTHETIC-FRANCHISE",)).fetchone()
            if revision != expected:
                raise ValueError("stale-revision")
            state = json.loads(raw)
            if state["universe"]["players"][0]["teamId"] != "A" or state["assets"]["contracts"][0]["teamId"] != "A" or state["assets"]["draftPicks"][0]["currentOwnerId"] != "A" or state["universe"]["prospects"][0]["rightsTeamId"] != "A":
                raise ValueError("stale-linked-ownership")
            state["universe"]["players"][0]["teamId"] = "B"
            state["assets"]["contracts"][0]["teamId"] = "B"
            state["assets"]["draftPicks"][0]["currentOwnerId"] = "B"
            state["universe"]["prospects"][0]["rightsTeamId"] = "B"
            state["activity"]["transactions"].append({"decision":decision,"synthetic":True})
            changed = db.execute("UPDATE block_a_lab_franchises SET state_revision=?,game_state_json=? WHERE franchise_id=? AND state_revision=?",
                                 (expected+1,json.dumps(state),"SYNTHETIC-FRANCHISE",expected)).rowcount
            if changed != 1:
                raise ValueError("CAS-rejected")
            if fail == "state":
                raise RuntimeError("injected-state-failure")
            db.execute("INSERT INTO block_a_lab_consumed_decisions(decision_id,franchise_id,proposal_digest,previous_revision,next_revision) VALUES (?,?,?,?,?)",
                       (decision,"SYNTHETIC-FRANCHISE","synthetic-digest",expected,expected+1))
            if fail == "replay":
                raise RuntimeError("injected-replay-failure")
            db.execute("INSERT INTO block_a_lab_transaction_history(transaction_id,franchise_id,decision_id,previous_revision,next_revision,asset_delta_json) VALUES (?,?,?,?,?,?)",
                       ("history-"+decision,"SYNTHETIC-FRANCHISE",decision,expected,expected+1,json.dumps({"synthetic":True})))
            if fail == "history":
                raise RuntimeError("injected-history-failure")
            db.execute("COMMIT")
        except BaseException:
            db.execute("ROLLBACK")
            raise

    def test_two_connections_competing_revision_only_one_can_commit(self):
        self.transfer(self.a,1,"SYNTHETIC-DECISION-A")
        with self.assertRaisesRegex(ValueError,"stale-revision"):
            self.transfer(self.b,1,"SYNTHETIC-DECISION-B")
        self.assertEqual(self.snapshot(self.a),self.snapshot(self.b))
        state = json.loads(self.snapshot(self.a)[0][1])
        self.assertEqual(self.snapshot(self.a)[0][0],2)
        self.assertEqual([state["universe"]["players"][0]["teamId"],state["assets"]["contracts"][0]["teamId"],
                          state["assets"]["draftPicks"][0]["currentOwnerId"],state["universe"]["prospects"][0]["rightsTeamId"]],["B"]*4)
        self.assertEqual(state["history"]["seasons"],self.initial["history"]["seasons"])
        self.assertEqual(len(self.snapshot(self.a)[1]),1)
        self.assertEqual(len(self.snapshot(self.a)[2]),1)

    def test_every_injected_failure_rolls_back_across_connections(self):
        before = self.snapshot(self.a)
        for fail in ("state","replay","history"):
            with self.assertRaises(RuntimeError):
                self.transfer(self.a,1,"SYNTHETIC-FAILED-"+fail,fail)
            self.assertEqual(self.snapshot(self.b),before)
        self.transfer(self.b,1,"SYNTHETIC-VALID")
        self.assertEqual(self.snapshot(self.a),self.snapshot(self.b))

    def test_duplicate_decision_constraint_rolls_back_state_and_history(self):
        # Seed a consumed identifier for another synthetic franchise so the CAS can
        # succeed locally before UNIQUE decision_id rejects it.
        self.a.execute("INSERT INTO block_a_lab_consumed_decisions(decision_id,franchise_id,proposal_digest,previous_revision,next_revision) VALUES (?,?,?,?,?)",
                       ("SYNTHETIC-DUP","SYNTHETIC-FRANCHISE","synthetic-digest",0,1))
        before = self.snapshot(self.a)
        with self.assertRaises(sqlite3.IntegrityError):
            self.transfer(self.b,1,"SYNTHETIC-DUP")
        self.assertEqual(self.snapshot(self.a),before)

    def tearDown(self):
        self.a.close()
        self.b.close()
        self.temp.cleanup()

if __name__ == "__main__":
    unittest.main()
