"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createGMReviewAdapter } = require("./hlm-phase11-block-l-browser-adapter.js");
const base = { franchise: "SYNTHETIC", revision: 1, review_id: "R1", decision_id: "D1" };
test("default-off never invokes transport", async () => {
  let calls = 0;
  const adapter = createGMReviewAdapter({ transport: async () => { calls++; } });
  await assert.rejects(adapter.approve(base), /disabled/);
  assert.equal(calls, 0);
});
test("enabled adapter requires identity and transport", () => {
  assert.throws(() => createGMReviewAdapter({ enabled: true }), /transport/);
});
test("rejects unauthenticated, stale-shaped, and missing review decisions", async () => {
  const adapter = createGMReviewAdapter({ enabled: true, identity: async () => ({ authenticated: false }), transport: async () => { throw Error("should not call"); } });
  await assert.rejects(adapter.approve(base), /Authenticated/);
  const active = createGMReviewAdapter({ enabled: true, identity: async () => ({ authenticated: true, gm: "GM1" }), transport: async () => true });
  await assert.rejects(active.approve({ ...base, revision: -1 }), /revision/);
  await assert.rejects(active.approve({ ...base, review_id: "" }), /Review ID/);
  await assert.rejects(active.approve({ ...base, decision_id: "" }), /Decision ID/);
});
test("explicit review, decline, recover, approval and replay are forwarded, never synthesized", async () => {
  const events = [];
  const adapter = createGMReviewAdapter({ enabled: true, identity: async () => ({ authenticated: true, gm: "GM1" }), transport: async request => {
    events.push(request);
    return request.action === "approve" ? { committed: events.filter(x => x.action === "approve").length === 1 } : { committed: false };
  }});
  await adapter.review(base);
  await adapter.decline(base);
  await adapter.recover(base);
  assert.equal((await adapter.approve(base)).committed, true);
  assert.equal((await adapter.approve(base)).committed, false);
  assert.deepEqual(events.map(x => x.action), ["review", "decline", "recover", "approve", "approve"]);
  assert.ok(events.every(x => x.gm === "GM1"));
});
test("blocks concurrent settlement and clears lock after failure", async () => {
  let release;
  const adapter = createGMReviewAdapter({ enabled: true, identity: async () => ({ authenticated: true, gm: "GM1" }), transport: () => new Promise(resolve => { release = resolve; }) });
  const first = adapter.approve(base);
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(adapter.approve(base), /already in progress/);
  release({ committed: true });
  assert.equal((await first).committed, true);
});
