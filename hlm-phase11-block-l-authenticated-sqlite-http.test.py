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
        self.binding=binding.IsolatedReviewBinding(
            secret=b"server-only-secret-key-32-bytes-minimum",
            authoritative_resolver=lambda gm,franchise:resolver.resolve_authoritative_review(self.db,gm,franchise))
        self.app=wsgi.create_experimental_wsgi_app(
            enabled=True,origin="https://jduns001-sudo.github.io",
            session_resolver=lambda bearer: {"gm":self.gm["token"],"franchise":"SYNTHETIC-F"}
                if bearer=="Bearer valid" else None,
            csrf_verifier=lambda session,token:token=="csrf-valid",
            authorize=lambda session,franchise:franchise==session["franchise"],
            bridge_factory=lambda session,franchise:bridge.GMReviewSimulationBridge(self.coordinator),
            binding_issuer=self.binding.issue,binding_verifier=self.binding.verify)
    def command(self,action,**fields):
        return super().command(action,**fields)
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
if __name__=="__main__":
    import unittest
    unittest.main()
