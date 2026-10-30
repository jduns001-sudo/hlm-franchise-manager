'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const entryModule = require('./hlm-phase11-experimental-cpu-trade-entry');

const ROOT = __dirname;
const REQUEST = Object.freeze({
  proposalId: 'entry-test-proposal',
  proposal: Object.freeze({outgoingPlayerId: 'player-a', incomingPlayerId: 'player-b'})
});

function providerFor({reviewResult, decisionResult, review, decide} = {}) {
  const calls = {createCoordinator: 0, getReviewRequest: 0, review: 0, decisions: []};
  const provider = {
    async createCoordinator() {
      calls.createCoordinator += 1;
      return {
        enabled: true,
        async review(...args) {
          calls.review += 1;
          if (review) return review(...args);
          return reviewResult || {
            status: 'awaiting-human-gm-approval',
            saved: false,
            settlementAuthorized: false
          };
        },
        async decide(action) {
          calls.decisions.push(action);
          if (decide) return decide(action);
          return decisionResult || {
            status: 'isolated-trade-candidate-committed',
            saved: true,
            settlementAuthorized: false,
            atomicSettlementVerified: false
          };
        }
      };
    },
    async getReviewRequest() {
      calls.getReviewRequest += 1;
      return REQUEST;
    }
  };
  return {provider, calls};
}

test('default-off entry never contacts the provider', async () => {
  const {provider, calls} = providerFor();
  const entry = entryModule.createEntry({provider});

  assert.equal(entry.getState().code, 'disabled-by-default');
  assert.equal((await entry.review()).code, 'disabled-by-default');
  assert.equal((await entry.decide('approve')).code, 'disabled-by-default');
  assert.deepEqual(calls, {createCoordinator: 0, getReviewRequest: 0, review: 0, decisions: []});
});

test('missing trusted provider fails closed without a test-consent fallback', async () => {
  const entry = entryModule.createEntry({enabled: true});

  assert.equal(entry.getState().code, 'trusted-server-authority-unavailable');
  assert.equal((await entry.review()).code, 'trusted-server-authority-unavailable');
  assert.equal(entry.getState().saved, false);
  assert.equal(entry.getState().pending, false);
});

test('explicit human approval is required before a successful isolated outcome', async () => {
  const {provider, calls} = providerFor();
  const entry = entryModule.createEntry({enabled: true, provider});

  const review = await entry.review();
  assert.equal(review.code, 'awaiting-human-gm-approval');
  assert.equal(review.saved, false);
  assert.equal(calls.decisions.length, 0);

  const outcome = await entry.decide('approve');
  assert.equal(outcome.code, 'trade-settled-isolated');
  assert.equal(outcome.saved, true);
  assert.deepEqual(calls.decisions, ['approve']);
});

for (const action of ['decline', 'cancel']) {
  test(`${action} clears pending approval without reporting a save`, async () => {
    const {provider, calls} = providerFor({
      decide: async () => ({saved: false, settlementAuthorized: false})
    });
    const entry = entryModule.createEntry({enabled: true, provider});

    await entry.review();
    const outcome = await entry.decide(action);
    assert.equal(outcome.code, action);
    assert.equal(outcome.saved, false);
    assert.equal(outcome.pending, false);
    assert.deepEqual(calls.decisions, [action]);
  });
}

test('invalid consent/review outcome blocks GM approval', async () => {
  const {provider, calls} = providerFor({
    reviewResult: {code: 'expired-consent', saved: false}
  });
  const entry = entryModule.createEntry({enabled: true, provider});

  assert.equal((await entry.review()).code, 'expired-consent');
  assert.equal(entry.getState().pending, false);
  assert.equal((await entry.decide('approve')).code, 'review-required');
  assert.deepEqual(calls.decisions, []);
});

test('clear/reload invalidates an in-flight authority response', async () => {
  let releaseReview;
  const {provider} = providerFor({
    review: () => new Promise(resolve => { releaseReview = resolve; })
  });
  const entry = entryModule.createEntry({enabled: true, provider});
  const pendingReview = entry.review();
  assert.equal(entry.getState().busy, true);
  await new Promise(resolve => setImmediate(resolve));

  const reset = entry.reload();
  assert.equal(reset.code, 'ready');
  assert.equal(reset.busy, false);
  releaseReview({
    status: 'awaiting-human-gm-approval',
    saved: false,
    settlementAuthorized: false
  });
  await pendingReview;

  assert.equal(entry.getState().code, 'ready');
  assert.equal(entry.getState().pending, false);
  assert.equal(entry.getState().saved, false);
});

test('entry wiring is isolated from production persistence and preserves the main app', () => {
  const app = fs.readFileSync(path.join(ROOT, 'app.html'), 'utf8');
  const page = fs.readFileSync(path.join(ROOT, 'hlm-phase11-experimental-cpu-trade-entry.html'), 'utf8');
  const controller = fs.readFileSync(path.join(ROOT, 'hlm-phase11-experimental-cpu-trade-entry.js'), 'utf8');

  assert.match(app, /id="hlm-experimental-cpu-trade-entry" href="\.\/hlm-phase11-experimental-cpu-trade-entry\.html"/);
  assert.match(page, /OFF — no authenticated browser authority is configured/);
  assert.match(page, /No browser-to-authority request is made/);
  assert.match(page, /does\s+not access production\s+franchise saves/);
  assert.doesNotMatch(page, /<script\b|HLMExperimentalCpuTradeProvider|HLM_PHASE11_EXPERIMENTAL_CPU_TRADING_ENABLED/);
  assert.equal((page.match(/<button\b[^>]*disabled/g) || []).length, 4);
  assert.doesNotMatch(controller, /root\.HLMExperimentalCpuTradeEntry/);
  assert.doesNotMatch(page + controller, /\b(?:indexedDB|localStorage|sessionStorage)\b/);
  assert.doesNotMatch(page, /privateKey|bearerToken|sqliteConnection|cpuPolicy/i);
});
