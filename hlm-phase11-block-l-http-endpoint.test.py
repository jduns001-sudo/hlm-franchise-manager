"""Block L endpoint security acceptance using a deterministic fake coordinator."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("block_l_http", Path(__file__).with_name("hlm-phase11-block-l-http-endpoint.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class EndpointAcceptance(unittest.TestCase):
    def setUp(self):
        self.calls = []
        outer = self
        class Bridge:
            def review(self, **kwargs):
                outer.calls.append(("review", kwargs))
                return {"review_id": "R1", "status": "pending"}
            def recover(self, **kwargs):
                outer.calls.append(("recover", kwargs))
                return {"status": "pending"}
            def decide(self, **kwargs):
                outer.calls.append(("decide", kwargs))
                return {"committed": kwargs["action"] == "approve"}
        self.endpoint = mod.ExperimentalGMReviewEndpoint(
            session_resolver=lambda token: {"gm": {"token": "server-session"}, "franchise": "SYNTHETIC"} if token == "Bearer valid" else None,
            csrf_verifier=lambda session, token: token == "csrf-valid",
            authorize=lambda session, franchise: franchise == session["franchise"],
            bridge_factory=lambda session, franchise: Bridge(),
            origin="https://jduns001-sudo.github.io")
        self.headers = {"Origin": "https://jduns001-sudo.github.io", "Content-Type": "application/json", "Authorization": "Bearer valid", "X-CSRF-Token": "csrf-valid"}

    def request(self, body, headers=None):
        return self.endpoint.handle(headers=headers or self.headers, body=body)

    def test_decline_and_approve_use_trusted_gm(self):
        body = '{"action":"decline","gm":"ATTACKER","franchise":"SYNTHETIC","revision":1,"seed":17,"decision_id":"D1","review_id":"R1"}'
        self.assertEqual(self.request(body)[0], 200)
        self.assertEqual(self.calls[-1][1]["gm"], {"token": "server-session"})
        self.assertEqual(self.calls[-1][1]["action"], "decline")
        self.assertFalse(self.request(body)[1]["committed"])
        self.assertTrue(self.request(body.replace("decline", "approve"))[1]["committed"])

    def test_origin_auth_csrf_and_franchise_rejection(self):
        body = '{"action":"review","franchise":"SYNTHETIC","revision":1,"seed":17}'
        for change, expected in [({"Origin":"https://evil.invalid"},403),({"Authorization":"Bearer wrong"},401),({"X-CSRF-Token":"bad"},403)]:
            self.assertEqual(self.request(body, {**self.headers, **change})[0], expected)
        self.assertEqual(self.request(body.replace("SYNTHETIC","OTHER"))[0],403)
        self.assertEqual(self.calls, [])

    def test_invalid_actions_and_revisions_rejected(self):
        for body in ['{"action":"delete","franchise":"SYNTHETIC","revision":1}', '{"action":"review","franchise":"SYNTHETIC","revision":true}', '[]']:
            self.assertEqual(self.request(body)[0],400)
        self.assertEqual(self.calls, [])

if __name__ == "__main__":
    unittest.main()
