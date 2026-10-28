"""Real SQLite + WSGI authenticated binding issuance and settlement regression.

Uses the existing isolated synthetic Block K fixture. NOT a production or
browser-loaded franchise and deliberately does not mount a live service.
"""
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).parent
def load(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/file)
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

prior=load("block_l_binding_http_prior","hlm-phase11-block-l-real-sqlite-http.test.py")
resolver=load("block_l_binding_http_resolver","hlm-phase11-block-l-sqlite-binding-resolver.py")
enrollment=load("block_l_binding_http_enrollment","hlm-phase11-block-l-trusted-enrollment.py")
binding=load("block_l_binding_http_binding","hlm-phase11-block-l-authoritative-binding.py")
bridge=load("block_l_binding_http_bridge","hlm-phase11-block-l-gm-review-bridge.py")
wsgi=load("block_l_binding_http_wsgi","hlm-phase11-block-l-experimental-wsgi.py")

class AuthenticatedSQLiteBindingHTTP(prior.RealSQLiteHTTPAcceptance):
    def setUp(self):
        super().setUp()
        self.db.execute(resolver.SCHEMA)
        self.db.execute("""INSERT INTO block_l_authoritative_reviews VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            ("SYNTHETIC-F",self.gm["token"],"ISOLATED-SAVE","TEAM-1","GAME-1",
             "BASELINE-1",json.dumps(["P1","P2"]),"PLAN-1","SYNTHETIC-DAY-18",1,17))
        enrollment.enroll_trusted_franchise(self.db, principal=self.gm["token"], franchise="SYNTHETIC-F",
            save_id="ISOLATED-SAVE", team_id="TEAM-1", source_digest="TRUSTED-FIXTURE-DIGEST", attested_by="trusted-host",
            trusted_source_resolver=lambda gm,franchise: dict(owner_gm=self.gm["token"], franchise="SYNTHETIC-F",
                browserSaveId="ISOLATED-SAVE", controlledTeamId="TEAM-1", sourceDigest="TRUSTED-FIXTURE-DIGEST"))
        self.binding=binding.IsolatedReviewBinding(
            secret=b"server-only-secret-key-32-bytes-minimum",
            authoritative_resolver=lambda gm,franchise:resolver.resolve_authoritative_review(self.db,gm,franchise,require_enrollment=True))
        self.app=wsgi.create_experimental_wsgi_app(
            enabled=True,origin="https://jduns001-sudo.github.io",
            session_resolver=lambda bearer: {"gm":self.gm,"franchise":"SYNTHETIC-F","session_id":"isolated-session"}
                if bearer=="Bearer valid" else None,
            csrf_verifier=lambda session,token:token=="csrf-valid",
            authorize=lambda session,franchise:franchise==session["franchise"],
            bridge_factory=lambda session,franchise:bridge.GMReviewSimulationBridge(self.coordinator),
            binding_issuer=lambda *,session,franchise:self.binding.issue(session={"gm":session["gm"]["token"],"session_id":session["session_id"]},franchise=franchise),
            binding_verifier=lambda *,session,envelope:self.binding.verify(session={"gm":session["gm"]["token"],"session_id":session["session_id"]},envelope=envelope))
    def command(self,action,**fields):
        return super().command(action,**fields)
    def test_enrollment_owner_save_and_team_mismatch_rejected_without_write(self):
        before=self.snapshot_all()
        for column,value in (("owner_gm","OTHER"),("browser_save_id","OTHER-SAVE"),("controlled_team_id","OTHER-TEAM")):
            with self.subTest(column=column):
                original=self.db.execute("SELECT "+column+" FROM block_l_trusted_enrollments WHERE franchise=?",("SYNTHETIC-F",)).fetchone()[0]
                self.db.execute("UPDATE block_l_trusted_enrollments SET "+column+"=? WHERE franchise=?",(value,"SYNTHETIC-F"))
                self.assertEqual(self.command("bind",seed=17)[0],403)
                self.db.execute("UPDATE block_l_trusted_enrollments SET "+column+"=? WHERE franchise=?",(original,"SYNTHETIC-F"))
                self.assertEqual(self.snapshot_all(),before)

    def test_authenticated_issue_review_approve_replay(self):
        status,issued=self.command("bind",seed=17)
        self.assertEqual(status,200)
        self.assertFalse(issued["committed"])
        signed=issued["server_binding"]
        status,review=self.command("review",seed=17,server_binding=signed)
        self.assertEqual(status,200)
        token=review["review_id"]
        status,result=self.command("approve",seed=17,review_id=token,
            decision_id="SYNTHETIC-DAY-18",server_binding=signed)
        self.assertEqual(status,200)
        self.assertTrue(result["committed"])
        before=self.snapshot_all()
        self.assertFalse(self.command("approve",seed=17,review_id=token,
            decision_id="SYNTHETIC-DAY-18",server_binding=signed)[1]["committed"])
        self.assertEqual(self.snapshot_all(),before)
    def test_session_rotation_rejects_signed_review_without_write(self):
        status,issued=self.command("bind",seed=17)
        self.assertEqual(status,200)
        signed=issued["server_binding"]
        before=self.snapshot_all()
        original=self.binding._clock
        try:
            self.binding._clock=lambda: original()+301
            self.assertEqual(self.command("review",seed=17,server_binding=signed)[0],403)
            self.assertEqual(self.snapshot_all(),before)
        finally:
            self.binding._clock=original

    def test_missing_forged_stale_and_other_gm_fail_without_write(self):
        status,issued=self.command("bind",seed=17)
        self.assertEqual(status,200)
        signed=issued["server_binding"]
        before=self.snapshot_all()
        self.assertEqual(self.command("review",seed=17)[0],403)
        forged=json.loads(json.dumps(signed))
        forged["binding"]["playerIds"]=["FORGED"]
        self.assertEqual(self.command("review",seed=17,server_binding=forged)[0],403)
        self.db.execute("UPDATE block_l_authoritative_reviews SET revision=2 WHERE franchise='SYNTHETIC-F'")
        self.assertEqual(self.command("review",seed=17,server_binding=signed)[0],403)
        self.assertEqual(self.snapshot_all(),before)
def load_tests(loader, tests, pattern):
    import unittest
    return unittest.TestSuite([
        AuthenticatedSQLiteBindingHTTP("test_authenticated_issue_review_approve_replay"),
        AuthenticatedSQLiteBindingHTTP("test_missing_forged_stale_and_other_gm_fail_without_write"),
        AuthenticatedSQLiteBindingHTTP("test_session_rotation_rejects_signed_review_without_write"),
        AuthenticatedSQLiteBindingHTTP("test_enrollment_owner_save_and_team_mismatch_rejected_without_write")
    ])

if __name__=="__main__":
    import unittest
    unittest.main()
