"""SQLite authority resolver regression. Temporary in-memory synthetic fixture only."""
import importlib.util
import json
import sqlite3
import unittest
from pathlib import Path

def load(name, filename):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(filename))
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

resolver=load("block_l_sqlite_resolver","hlm-phase11-block-l-sqlite-binding-resolver.py")
binding=load("block_l_binding","hlm-phase11-block-l-authoritative-binding.py")

class SQLiteAuthorityTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(":memory:")
        self.db.execute(resolver.SCHEMA)
        self.db.execute("""INSERT INTO block_l_authoritative_reviews VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            ("F1","GM1","SAVE1","TEAM1","GAME1","BASE1",json.dumps(["P1","P2"]),
             "PLAN1","DEC1",1,17))
        self.service=binding.IsolatedReviewBinding(secret=b"k"*32,
            authoritative_resolver=lambda gm,franchise:resolver.resolve_authoritative_review(self.db,gm,franchise))
    def tearDown(self):
        self.db.close()
    def test_authorized_issue_and_read_only_verification(self):
        before=self.db.total_changes
        token=self.service.issue(session={"gm":"GM1","session_id":"TRUSTED-SESSION-1"},franchise="F1")
        self.assertEqual(self.service.verify(session={"gm":"GM1","session_id":"TRUSTED-SESSION-1"},envelope=token)["playerIds"],["P1","P2"])
        self.assertEqual(self.db.total_changes,before)
    def test_wrong_owner_cannot_issue(self):
        with self.assertRaises(PermissionError):
            self.service.issue(session={"gm":"GM2","session_id":"TRUSTED-SESSION-2"},franchise="F1")
    def test_stale_review_rejected_after_authoritative_revision(self):
        token=self.service.issue(session={"gm":"GM1","session_id":"TRUSTED-SESSION-1"},franchise="F1")
        self.db.execute("UPDATE block_l_authoritative_reviews SET revision=2 WHERE franchise='F1'")
        with self.assertRaises(PermissionError):
            self.service.verify(session={"gm":"GM1","session_id":"TRUSTED-SESSION-1"},envelope=token)
    def test_altered_plan_and_players_rejected(self):
        for column,value in (("plan_id","PLAN2"),("player_ids_json",json.dumps(["P3"]))):
            with self.subTest(column=column):
                token=self.service.issue(session={"gm":"GM1","session_id":"TRUSTED-SESSION-1"},franchise="F1")
                self.db.execute("UPDATE block_l_authoritative_reviews SET "+column+"=? WHERE franchise='F1'",(value,))
                with self.assertRaises(PermissionError):
                    self.service.verify(session={"gm":"GM1","session_id":"TRUSTED-SESSION-1"},envelope=token)
                self.db.execute("UPDATE block_l_authoritative_reviews SET "+column+"=? WHERE franchise='F1'",
                    ("PLAN1" if column=="plan_id" else json.dumps(["P1","P2"]),))
if __name__=="__main__":
    unittest.main()
