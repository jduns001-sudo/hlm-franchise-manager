"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createServiceTransport } = require("./hlm-phase11-block-l-service-transport.js");
const { createGMReviewAdapter } = require("./hlm-phase11-block-l-browser-adapter.js");
const config = { enabled: true, endpoint: "https://example.invalid/gm-review", allowedOrigin: "https://jduns001-sudo.github.io", currentOrigin: "https://jduns001-sudo.github.io", credentials: async () => ({ bearer: "test-session", csrf: "test-csrf" }) };
function configWith(extra) { return { ...config, fetchImpl: async () => ({ ok: true, json: async () => ({ committed: false }) }), ...extra }; }
test("transport is disabled unless explicitly opted in", () => {
  assert.throws(() => createServiceTransport(configWith({ enabled: false })), /disabled/);
});
test("rejects insecure, redirected, or ambiguous endpoints", () => {
  for (const endpoint of ["http://example.invalid/gm-review", "https://example.invalid/gm-review?token=x", "https://example.invalid/other"]) {
    assert.throws(() => createServiceTransport(configWith({ endpoint })), /HTTPS/);
  }
  assert.throws(() => createServiceTransport(configWith({ currentOrigin: "https://attacker.invalid" })), /origin mismatch/);
});
test("forwards explicit commands with credentials, CSRF, no redirect and no cookie", async () => {
  let sent;
  const transport = createServiceTransport(configWith({ fetchImpl: async (url, init) => { sent = { url, init }; return { ok: true, json: async () => ({ committed: false, status: "declined" }) }; } }));
  const adapter = createGMReviewAdapter({ enabled: true, identity: async () => ({ authenticated: true, gm: "GM1" }), transport });
  assert.equal((await adapter.decline({ franchise: "SYNTHETIC", revision: 1, review_id: "R1" })).committed, false);
  assert.equal(sent.init.redirect, "error");
  assert.equal(sent.init.credentials, "omit");
  assert.equal(sent.init.headers["X-CSRF-Token"], "test-csrf");
  assert.equal(JSON.parse(sent.init.body).action, "decline");
});
test("rejects failed service response and missing credentials", async () => {
  const failed = createServiceTransport(configWith({ fetchImpl: async () => ({ ok: false }) }));
  await assert.rejects(failed({ action: "review" }), /rejected/);
  const missing = createServiceTransport(configWith({ credentials: async () => ({}) }));
  await assert.rejects(missing({ action: "review" }), /credentials/);
});
