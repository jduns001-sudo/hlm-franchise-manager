"""Regression tests for the test-only authenticated SQLite settlement lab."""
import copy
import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).parent
spec=importlib.util.spec_from_file_location("isolated_auth_lab",ROOT/"hlm-phase11-block-a-authenticated-sqlite-lab.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class AuthenticatedSqliteTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.path=str(Path(self.temp.name)/"synthetic.sqlite")
        self.db=sqlite3.connect(self.path,isolation_level=None)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript((ROOT/"hlm-phase11-block-a-isolated-persistence.sql").read_text())
        self.original={"universe":{"players":[{"id":"SYNTHETIC-P","teamId":"A"}],"prospects":[{"id":"SYNTHETIC-R","rightsTeamId":"A"}]},
                       "assets":{"contracts":[{"playerId":"SYNTHETIC-P","teamId":"A"}],"draftPicks":[{"pickId":"SYNTHETIC-K","currentOwnerId":"A"}]},
                       "activity":{"transactions":[]},"history":{"seasons":[{"season":"SYNTHETIC-PRIOR"}]}}
        self.db.execute("INSERT INTO block_a_lab_franchises(franchise_id,state_revision,game_state_json) VALUES (?,?,?)",("SYNTHETIC-F",1,json.dumps(self.original)))
        self.lab=module.IsolatedAuthenticatedSettlementLab(self.db)
        self.gm=self.lab.issue_gm("SYNTHETIC-F","SYNTHETIC-GM")
        self.cpu=self.lab.issue_cpu("SYNTHETIC-F",1,"SYNTHETIC-DIGEST")
        self.request=dict(gm=self.gm,cpu=self.cpu,franchise="SYNTHETIC-F",revision=1,digest="SYNTHETIC-DIGEST",approved=True,enabled=True)

    def snapshot(self):
        return (self.db.execute("SELECT state_revision,game_state_json FROM block_a_lab_franchises").fetchall(),
                self.db.execute("SELECT * FROM block_a_lab_consumed_decisions").fetchall(),
                self.db.execute("SELECT * FROM block_a_lab_transaction_history").fetchall())

    def test_authorized_lab_commit_is_atomic_and_preserves_prior_season(self):
        result=self.lab.settle(**self.request)
        self.assertTrue(result["committed"])
        self.assertFalse(result["productionSaved"])
        revision,raw=self.snapshot()[0][0]
        state=json.loads(raw)
        self.assertEqual(revision,2)
        self.assertEqual([state["universe"]["players"][0]["teamId"],state["assets"]["contracts"][0]["teamId"],
                          state["assets"]["draftPicks"][0]["currentOwnerId"],state["universe"]["prospects"][0]["rightsTeamId"]],["B"]*4)
        self.assertEqual(state["history"]["seasons"],self.original["history"]["seasons"])
        self.assertEqual(len(self.snapshot()[1]),1)
        self.assertEqual(len(self.snapshot()[2]),1)
        self.assertFalse(self.lab.settle(**self.request)["committed"])

    def test_invalid_authority_and_cancellation_do_not_write(self):
        before=self.snapshot()
        attempts=[
            dict(self.request,gm={**self.gm,"proof":"0"*64}),
            dict(self.request,cpu={**self.cpu,"proof":"0"*64}),
            dict(self.request,revision=2),
            dict(self.request,digest="OTHER"),
            dict(self.request,approved=False),
            dict(self.request,enabled=False),
            dict(self.request,cancelled=True),
            dict(self.request,declined=True),
            dict(self.request,gm={"token":"fake","gm":"SYNTHETIC-GM","proof":"0"*64}),
        ]
        for request in attempts:
            self.assertFalse(self.lab.settle(**request)["committed"])
            self.assertEqual(self.snapshot(),before)

    def test_each_injected_failure_rolls_back_all_tables(self):
        before=self.snapshot()
        for point in ("state","replay","history"):
            self.assertFalse(self.lab.settle(**self.request,fail_at=point)["committed"])
            self.assertEqual(self.snapshot(),before)
        self.assertTrue(self.lab.settle(**self.request)["committed"])

    def test_second_connection_sees_committed_state_and_rejects_stale(self):
        other=sqlite3.connect(self.path,isolation_level=None)
        try:
            self.assertTrue(self.lab.settle(**self.request)["committed"])
            self.assertEqual(other.execute("SELECT state_revision FROM block_a_lab_franchises").fetchone()[0],2)
            self.assertFalse(self.lab.settle(**self.request)["committed"])
        finally:
            other.close()

    def tearDown(self):
        self.db.close()
        self.temp.cleanup()

if __name__=="__main__":
    unittest.main()
