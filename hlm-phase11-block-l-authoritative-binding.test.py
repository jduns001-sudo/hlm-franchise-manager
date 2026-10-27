"""Deterministic isolated server-binding security regression (no production writes)."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("binding", Path(__file__).with_name("hlm-phase11-block-l-authoritative-binding.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class BindingTests(unittest.TestCase):
    def setUp(self):
        self.record = dict(owner_gm="GM1", franchise="F1", browserSaveId="SAVE1",
            controlledTeamId="TEAM1", gameId="GAME1", browserBaseline="HASH1",
            playerIds=["P1", "P2"], plan_id="PLAN1", decision_id="D1",
            revision=1, seed=17)
        self.binding = module.IsolatedReviewBinding(secret=b"s"*32,
            authoritative_resolver=lambda gm, franchise: dict(self.record) if franchise == "F1" else None)
        self.session = {"gm":"GM1"}

    def test_issue_verify_and_tamper_rejection(self):
        envelope = self.binding.issue(session=self.session, franchise="F1")
        self.assertEqual(self.binding.verify(session=self.session, envelope=envelope)["gameId"], "GAME1")
        envelope["binding"]["playerIds"] = ["ATTACKER"]
        with self.assertRaises(PermissionError):
            self.binding.verify(session=self.session, envelope=envelope)

    def test_wrong_owner_and_session_rejected(self):
        with self.assertRaises(PermissionError):
            self.binding.issue(session={"gm":"GM2"}, franchise="F1")
        envelope = self.binding.issue(session=self.session, franchise="F1")
        with self.assertRaises(PermissionError):
            self.binding.verify(session={"gm":"GM2"}, envelope=envelope)

    def test_revision_plan_and_ownership_changes_invalidate_binding(self):
        for field, value in (("revision",2),("plan_id","OTHER"),("owner_gm","GM2"),("seed",18),("gameId","OTHER")):
            with self.subTest(field=field):
                envelope = self.binding.issue(session=self.session, franchise="F1")
                original = self.record[field]
                self.record[field] = value
                with self.assertRaises(PermissionError):
                    self.binding.verify(session=self.session, envelope=envelope)
                self.record[field] = original

    def test_missing_server_secret_or_authoritative_record(self):
        with self.assertRaises(ValueError):
            module.IsolatedReviewBinding(secret=b"weak", authoritative_resolver=lambda *args: None)
        with self.assertRaises(PermissionError):
            self.binding.issue(session=self.session, franchise="OTHER")

if __name__ == "__main__":
    unittest.main()
