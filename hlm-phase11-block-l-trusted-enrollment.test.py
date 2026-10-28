"""Deterministic trusted enrollment isolation tests."""
import importlib.util
import sqlite3
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("enrollment", Path(__file__).with_name("hlm-phase11-block-l-trusted-enrollment.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class TrustedEnrollmentTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.args = dict(principal="GM1", franchise="F1", save_id="SAVE1",
                         team_id="TEAM1", source_digest="trusted-digest",
                         attested_by="trusted-host")
    def tearDown(self):
        self.db.close()
    def test_enroll_idempotent_and_owner_isolated(self):
        self.assertTrue(module.enroll_trusted_franchise(self.db, **self.args))
        self.assertFalse(module.enroll_trusted_franchise(self.db, **self.args))
        self.assertEqual(module.resolve_trusted_enrollment(self.db, principal="GM1", franchise="F1")["controlledTeamId"], "TEAM1")
        self.assertIsNone(module.resolve_trusted_enrollment(self.db, principal="GM2", franchise="F1"))
    def test_conflicts_cannot_reassign_franchise(self):
        module.enroll_trusted_franchise(self.db, **self.args)
        for key, value in (("principal","GM2"),("save_id","ATTACKER"),("team_id","OTHER"),("source_digest","OTHER")):
            with self.subTest(key=key), self.assertRaises(PermissionError):
                module.enroll_trusted_franchise(self.db, **{**self.args, key:value})
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_l_trusted_enrollments").fetchone()[0], 1)
    def test_no_browser_attestation_and_invalid_fields(self):
        with self.assertRaises(PermissionError):
            module.enroll_trusted_franchise(self.db, **{**self.args, "attested_by":"browser"})
        with self.assertRaises(ValueError):
            module.enroll_trusted_franchise(self.db, **{**self.args, "principal":""})
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM block_l_trusted_enrollments").fetchone()[0], 0)

if __name__ == "__main__":
    unittest.main()
