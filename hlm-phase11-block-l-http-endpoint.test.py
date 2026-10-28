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
            origin="https://jduns001-sudo.github.io",
            binding_verifier=lambda *,session,envelope: {"franchise":"SYNTHETIC","revision":1,"seed":17,"decision_id":"D1"} if envelope=={"fixture":"signed"} else (_ for _ in ()).throw(PermissionError("missing")))
        self.headers = {"Origin": "https://jduns001-sudo.github.io", "Content-Type": "application/json", "Authorization": "Bearer valid", "X-CSRF-Token": "csrf-valid"}

    def request(self, body, headers=None):
        import json
        try:
            data=json.loads(body)
            if isinstance(data,dict) and "server_binding" not in data:
                data["server_binding"]={"fixture":"signed"}
                body=json.dumps(data)
        except (ValueError,TypeError):
            pass
        return self.endpoint.handle(headers=headers or self.headers, body=body)

    def test_endpoint_cannot_start_without_binding_verifier(self):
        with self.assertRaises(ValueError):
            mod.ExperimentalGMReviewEndpoint(session_resolver=lambda _:None,
                csrf_verifier=lambda *_:False, authorize=lambda *_:False,
                bridge_factory=lambda *_:None, origin="https://example.invalid")

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

    def test_seed_rejected_before_any_coordinator_call(self):
        for seed in ('true', '"17"', '-1', '1.5', 'null'):
            body = '{"action":"review","franchise":"SYNTHETIC","revision":1,"seed":' + seed + '}'
            self.assertEqual(self.request(body)[0], 400)
        self.assertEqual(self.calls, [])
        recover = '{"action":"recover","franchise":"SYNTHETIC","revision":1,"review_id":"R1"}'
        self.assertEqual(self.request(recover)[0], 200)
        self.assertEqual(self.calls[-1][0], "recover")

    def test_oversized_json_rejected_before_parsing(self):
        body = '{"action":"review","franchise":"SYNTHETIC","revision":1,"seed":17,"padding":"' + ("x" * 8192) + '"}'
        self.assertEqual(self.request(body)[0], 400)
        self.assertEqual(self.calls, [])

    def test_coordinator_cannot_override_committed_flag(self):
        class MalformedBridge:
            def review(self, **kwargs):
                return {"committed": "yes", "status": "pending"}
        self.endpoint.bridge_factory = lambda session, franchise: MalformedBridge()
        body = '{"action":"review","franchise":"SYNTHETIC","revision":1,"seed":17}'
        status, result = self.request(body)
        self.assertEqual(status, 400)
        self.assertIs(result["committed"], False)

    def test_opt_in_server_binding_rejects_missing_mismatched_and_tampered_requests(self):
        import json
        self.endpoint.binding_verifier = lambda *, session, envelope: (
            {"franchise":"SYNTHETIC","revision":1,"seed":17,"decision_id":"D1"}
            if envelope == {"signed":"trusted"} else (_ for _ in ()).throw(PermissionError("invalid")))
        request = {"action":"approve","franchise":"SYNTHETIC","revision":1,
                   "seed":17,"decision_id":"D1","review_id":"R1"}
        self.assertEqual(self.endpoint.handle(headers=self.headers,body=json.dumps(request))[0],403)
        self.assertEqual(self.calls,[])
        request["server_binding"]={"signed":"forged"}
        self.assertEqual(self.request(json.dumps(request))[0],403)
        self.assertEqual(self.calls,[])
        request["server_binding"]={"signed":"trusted"}
        for field, altered in (("revision",2),("seed",18),("decision_id","D2"),("franchise","OTHER")):
            with self.subTest(field=field):
                attempt={**request,field:altered}
                self.assertEqual(self.request(json.dumps(attempt))[0],403)
                self.assertEqual(self.calls,[])
        self.assertEqual(self.request(json.dumps(request))[0],200)
        self.assertEqual(len(self.calls),1)

    def test_authenticated_binding_issuance_is_explicit_and_no_save(self):
        import json
        payload={"action":"bind","franchise":"SYNTHETIC","revision":1,"seed":17}
        self.assertEqual(self.request(json.dumps(payload))[0],403)
        self.assertEqual(self.calls,[])
        self.endpoint.binding_issuer=lambda *,session,franchise: {
            "binding":{"franchise":franchise,"revision":1,"seed":17},
            "signature":"server-signed-fixture"}
        status,result=self.request(json.dumps(payload))
        self.assertEqual(status,200)
        self.assertFalse(result["committed"])
        self.assertEqual(result["server_binding"]["binding"]["franchise"],"SYNTHETIC")
        self.assertEqual(self.calls,[])
        for changes,expected in [
            ({"Authorization":"Bearer wrong"},401),
            ({"X-CSRF-Token":"bad"},403),
            ({"Origin":"https://evil.invalid"},403)]:
            self.assertEqual(self.request(json.dumps(payload),{**self.headers,**changes})[0],expected)
        self.assertEqual(self.request(json.dumps({**payload,"franchise":"OTHER"}))[0],403)
        self.assertEqual(self.request(json.dumps({**payload,"revision":2}))[0],403)
        self.assertEqual(self.calls,[])

if __name__ == "__main__":
    unittest.main()
