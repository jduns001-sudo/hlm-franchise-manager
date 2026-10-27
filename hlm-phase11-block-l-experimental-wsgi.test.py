"""Deterministic WSGI contract acceptance, no live server or production saves."""
import importlib.util
import io
import json
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location("hlm_wsgi",Path(__file__).with_name("hlm-phase11-block-l-experimental-wsgi.py"))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class WSGIAcceptance(unittest.TestCase):
    def setUp(self):
        self.events=[]
        outer=self
        class Bridge:
            def review(self,**kwargs):
                outer.events.append(("review",kwargs))
                return {"committed":False,"review_id":"R1"}
            def recover(self,**kwargs):
                return {"committed":False,"status":"pending"}
            def decide(self,**kwargs):
                outer.events.append(("decide",kwargs))
                return {"committed":False,"status":"declined"}
        self.kwargs=dict(enabled=True,origin="https://jduns001-sudo.github.io",
            session_resolver=lambda token: {"gm":{"token":"trusted"},"franchise":"SYNTHETIC"} if token=="Bearer valid" else None,
            csrf_verifier=lambda session,token:token=="valid-csrf",
            authorize=lambda session,franchise:session["franchise"]==franchise,
            bridge_factory=lambda session,franchise:Bridge())
        self.app=module.create_experimental_wsgi_app(**self.kwargs)
    def send(self, *, method="POST",scheme="https",origin="https://jduns001-sudo.github.io",token="Bearer valid",csrf="valid-csrf",path="/gm-review",payload=None):
        payload=payload or {"action":"review","franchise":"SYNTHETIC","revision":1,"seed":17}
        body=json.dumps(payload).encode()
        env={"REQUEST_METHOD":method,"PATH_INFO":path,"wsgi.url_scheme":scheme,
            "CONTENT_LENGTH":str(len(body)),"wsgi.input":io.BytesIO(body),
            "HTTP_ORIGIN":origin,"HTTP_AUTHORIZATION":token,"HTTP_X_CSRF_TOKEN":csrf,
            "CONTENT_TYPE":"application/json"}
        status=[]
        data=b"".join(self.app(env,lambda s,h:status.append(s)))
        return int(status[0][:3]),json.loads(data)
    def test_default_off_and_missing_dependencies(self):
        with self.assertRaises(RuntimeError):
            module.create_experimental_wsgi_app()
        with self.assertRaises(ValueError):
            module.create_experimental_wsgi_app(enabled=True,origin="https://example.invalid")
    def test_review_and_trusted_identity(self):
        status,result=self.send(payload={"action":"review","gm":"attacker","franchise":"SYNTHETIC","revision":1,"seed":17})
        self.assertEqual(status,200)
        self.assertFalse(result["committed"])
        self.assertEqual(self.events[0][1]["gm"],{"token":"trusted"})
    def test_rejects_insecure_or_unauthorized_requests(self):
        for kwargs,code in [({"scheme":"http"},403),({"method":"GET"},405),({"path":"/other"},404),
                            ({"origin":"https://evil.invalid"},403),({"token":"Bearer invalid"},401),
                            ({"csrf":"bad"},403)]:
            self.assertEqual(self.send(**kwargs)[0],code)
        self.assertEqual(self.events,[])
    def test_no_implicit_cross_origin_cors_permission(self):
        headers = []
        body = json.dumps({"action":"review","franchise":"SYNTHETIC","revision":1,"seed":17}).encode()
        env = {"REQUEST_METHOD":"POST","PATH_INFO":"/gm-review","wsgi.url_scheme":"https",
               "CONTENT_LENGTH":str(len(body)),"wsgi.input":io.BytesIO(body),
               "HTTP_ORIGIN":"https://evil.invalid","CONTENT_TYPE":"application/json"}
        self.app(env,lambda status,values:headers.extend(values))
        self.assertNotIn("Access-Control-Allow-Origin",dict(headers))

    def test_rejects_wrong_franchise(self):
        self.assertEqual(self.send(payload={"action":"review","franchise":"OTHER","revision":1,"seed":17})[0],403)
        self.assertEqual(self.events,[])

if __name__=="__main__":
    unittest.main()
