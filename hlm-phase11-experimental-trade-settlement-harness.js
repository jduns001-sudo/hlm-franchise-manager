'use strict';
/* Mission 1472: default-off composition harness; test consent is never trusted authority. */
const {
  DEFAULT_DATABASE_NAME,
  createExperimentalTradeIndexedDbRepository
} = require('./hlm-phase11-experimental-trade-indexeddb');
const {
  createIsolatedTradeSettlementTransaction
} = require('./hlm-phase11-isolated-trade-settlement-transaction');

const TEST_ONLY_KEY_ID = 'step27-test-only-consent';
const TEST_ONLY_SIGNATURE = 'NOT_TRUSTED_TEST_ONLY';

function createExperimentalTradeSettlementHarness({
  indexedDB = typeof globalThis !== 'undefined' ? globalThis.indexedDB : null,
  enabled = false,
  testOnlyConsentDouble = false,
  databaseName = DEFAULT_DATABASE_NAME
} = {}) {
  if (enabled !== false && enabled !== true) throw new TypeError('Invalid harness enable flag');
  if (testOnlyConsentDouble !== false && testOnlyConsentDouble !== true) {
    throw new TypeError('Invalid test-only consent option');
  }
  if (enabled && !testOnlyConsentDouble) {
    throw new Error('This isolated harness has no trusted CPU consent authority');
  }

  const repository = createExperimentalTradeIndexedDbRepository({
    indexedDB,
    enabled,
    databaseName
  });
  const consentVerifier = Object.freeze({
    async verify(envelope) {
      return testOnlyConsentDouble === true &&
        envelope?.testOnly === true &&
        envelope?.keyId === TEST_ONLY_KEY_ID &&
        envelope?.signature === TEST_ONLY_SIGNATURE;
    }
  });
  const transaction = createIsolatedTradeSettlementTransaction({
    repository,
    key: 'hlm-phase11-isolated-trade-settlement-test',
    enabled,
    consentVerifier
  });

  return Object.freeze({
    repository,
    transaction,
    testOnlyConsentDouble: testOnlyConsentDouble === true,
    consentMode: testOnlyConsentDouble ? 'TEST-ONLY-UNTRUSTED-DOUBLE' : 'FAIL-CLOSED',
    enabled
  });
}

module.exports = {
  TEST_ONLY_KEY_ID,
  TEST_ONLY_SIGNATURE,
  createExperimentalTradeSettlementHarness
};
