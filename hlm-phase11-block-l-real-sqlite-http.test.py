"""Block L real SQLite end-to-end WSGI acceptance, isolated synthetic franchise only."""
import importlib.util
import io
import json
from pathlib import Path

ROOT=Path(__file__).parent
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

prior=load("block_l_e2e_prior","hlm-phase11-block-k-concurrent-settlement.test.py")
bridge=load("block_l_e2e_bridge","hlm-phase11-block-l-gm-review-bridge.py")
wsgi=load("block_l_e2e_wsgi","hlm-phase11-block-l-experimental-wsgi.py")

class RealSQLiteHTTPAcceptance(prior.ConcurrentSettlementAcceptance):
    def setUp(self):
        super().setUp()
        self.coordinator=self.reviewed()
        self.gm=self.day_request["gm"]
        self.app=wsgi.create_experimental_wsgi_app(
            enabled=True,origin="https://jduns001-sudo.github.io",
            session_resolver=lambda bearer: {"gm":self.gm,"franchise":"SYNTHETIC-F"} if bearer=="Bearer valid" else None,
            csrf_verifier=lambda session,token:token=="csrf-valid",
            authorize=lambda session,franchise:franchise==session["franchise"],
            bridge_factory=lambda session,franchise:bridge.GMReviewSimulationBridge(self.coordinator))
    def command(self,action,**fields):
        body=json.dumps({"action":action,"franchise":"SYNTHETIC-F","revision":1,**fields}).encode()
        env={"PATH_INFO":"/gm-review","REQUEST_METHOD":"POST","wsgi.url_scheme":"https",
             "CONTENT_LENGTH":str(len(body)),"wsgi.input":io.BytesIO(body),
             "HTTP_ORIGIN":"https://jduns001-sudo.github.io",
             "HTTP_AUTHORIZATION":"Bearer valid","HTTP_X_CSRF_TOKEN":"csrf-valid",
             "CONTENT_TYPE":"application/json"}
        status=[]
        response=b"".join(self.app(env,lambda s,h:status.append(s)))
        return int(status[0][:3]),json.loads(response)
    def test_review_decline_approve_replay_and_recovery_over_wsgi(self):
        status,review=self.command("review",seed=17,gm={"token":"forged"})
        self.assertEqual(status,200)
        token=review["review_id"]
        before=self.snapshot_all()
        self.assertEqual(self.command("decline",seed=17,review_id=token,decision_id="SYNTHETIC-DAY-18")[1]["status"],"declined")
        self.assertEqual(self.snapshot_all(),before)
        self.assertEqual(self.command("recover",review_id=token)[1]["status"],"pending")
        status,approved=self.command("approve",seed=17,review_id=token,decision_id="SYNTHETIC-DAY-18")
        self.assertEqual(status,200)
        self.assertTrue(approved["committed"])
        after=self.snapshot_all()
        self.assertFalse(self.command("approve",seed=17,review_id=token,decision_id="SYNTHETIC-DAY-18")[1]["committed"])
        self.assertEqual(self.snapshot_all(),after)
        self.assertEqual(self.command("recover",review_id=token)[1]["status"],"consumed")
    def test_stale_review_no_write_over_wsgi(self):
        first=self.command("review",seed=17)[1]["review_id"]
        second=self.command("review",seed=17)[1]["review_id"]
        self.assertTrue(self.command("approve",seed=17,review_id=second,decision_id="SYNTHETIC-DAY-18")[1]["committed"])
        before=self.snapshot_all()
        self.assertFalse(self.command("approve",seed=17,review_id=first,decision_id="SYNTHETIC-DAY-OTHER")[1]["committed"])
        self.assertEqual(self.snapshot_all(),before)
        self.assertEqual(self.command("recover",review_id=first)[1]["status"],"stale")
    def test_invalid_seed_cannot_mutate_reviewed_state(self):
        token=self.command("review",seed=17)[1]["review_id"]
        before=self.snapshot_all()
        self.assertFalse(self.command("approve",seed=18,review_id=token,decision_id="SYNTHETIC-DAY-18")[1]["committed"])
        self.assertEqual(self.snapshot_all(),before)
        self.assertEqual(self.command("recover",review_id=token)[1]["status"],"pending")

if __name__=="__main__":
    import unittest
    unittest.main()
