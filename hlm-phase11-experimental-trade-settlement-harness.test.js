'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createExperimentalTradeSettlementHarness
} = require('./hlm-phase11-experimental-trade-settlement-harness');

test('default harness is disabled and consent verifier fails closed', async () => {
  let opens = 0;
  const harness = createExperimentalTradeSettlementHarness({
    indexedDB: {open() { opens++; throw Error('unexpected database open'); }}
  });
  assert.equal(harness.enabled, false);
  assert.equal(harness.consentMode, 'FAIL-CLOSED');
  assert.equal((await harness.transaction.review({}, {})).code, 'disabled-by-default');
  assert.equal(harness.testOnlyConsentDouble, false);
  assert.equal(opens, 0);
});

test('enabled harness requires explicit test-only consent; never claims trusted authority', () => {
  const indexedDB = {open() { throw Error('not called'); }};
  assert.throws(() => createExperimentalTradeSettlementHarness({
    indexedDB,
    enabled: true
  }), /no trusted CPU consent authority/);
  const harness = createExperimentalTradeSettlementHarness({
    indexedDB,
    enabled: true,
    testOnlyConsentDouble: true
  });
  assert.equal(harness.consentMode, 'TEST-ONLY-UNTRUSTED-DOUBLE');
});
