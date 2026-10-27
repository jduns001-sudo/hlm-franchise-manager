"""Opt-in WSGI mount for the experimental Block L GM command handler.

No listener is started here. The host must inject independently authenticated
session, CSRF and franchise authorization callbacks, and a Block K coordinator
factory. Never mount on production or GitHub Pages.
"""
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location("hlm_block_l_endpoint", Path(__file__).with_name("hlm-phase11-block-l-http-endpoint.py"))
endpoint_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(endpoint_module)

def create_experimental_wsgi_app(*, enabled=False, session_resolver=None,
                                 csrf_verifier=None, authorize=None,
                                 bridge_factory=None, origin=None):
    if enabled is not True:
        raise RuntimeError("Block L experimental service is disabled")
    if not all(callable(x) for x in (session_resolver, csrf_verifier, authorize, bridge_factory)):
        raise ValueError("Trusted host dependencies required")
    endpoint = endpoint_module.ExperimentalGMReviewEndpoint(
        session_resolver=session_resolver, csrf_verifier=csrf_verifier,
        authorize=authorize, bridge_factory=bridge_factory, origin=origin)
    def app(environ, start_response):
        def reply(status, payload):
            body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            start_response(str(status) + " " + {200:"OK",400:"Bad Request",401:"Unauthorized",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",413:"Payload Too Large",415:"Unsupported Media Type"}.get(status,"Error"),
                           [("Content-Type","application/json"),("Cache-Control","no-store"),
                            ("Content-Length",str(len(body))),("Access-Control-Allow-Origin",origin),
                            ("Vary","Origin")])
            return [body]
        if environ.get("PATH_INFO") != "/gm-review":
            return reply(404, {"committed":False,"error":"not_found"})
        if environ.get("REQUEST_METHOD") != "POST":
            return reply(405, {"committed":False,"error":"method"})
        if environ.get("wsgi.url_scheme") != "https":
            return reply(403, {"committed":False,"error":"https_required"})
        try:
            size = int(environ.get("CONTENT_LENGTH","0"))
        except (TypeError,ValueError):
            return reply(400, {"committed":False,"error":"content_length"})
        if size <= 0 or size > 8192:
            return reply(413, {"committed":False,"error":"size"})
        raw = environ["wsgi.input"].read(size)
        if len(raw) != size:
            return reply(400, {"committed":False,"error":"truncated"})
        try:
            body = raw.decode("utf-8")
        except UnicodeDecodeError:
            return reply(400, {"committed":False,"error":"encoding"})
        headers = {"Origin":environ.get("HTTP_ORIGIN"),
                   "Authorization":environ.get("HTTP_AUTHORIZATION"),
                   "X-CSRF-Token":environ.get("HTTP_X_CSRF_TOKEN"),
                   "Content-Type":environ.get("CONTENT_TYPE")}
        status, payload = endpoint.handle(headers=headers, body=body)
        return reply(status,payload)
    return app
