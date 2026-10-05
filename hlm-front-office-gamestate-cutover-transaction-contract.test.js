'use strict';
const assert = require('assert');
const { createFrontOfficeCutoverTransactionContract } = require('./hlm-front-office-gamestate-cutover-transaction-contract');

const preflight = Object.freeze({
  kind: 'front-office-gamestate-cutover-preflight',
  version: 1,
  ready: true,
  slotId: 'mission74',
  sourceAuthorized: true,
  recoveryCheckpointVerified: true,
  transactionReady: true,
  frontOfficeActivationAllowed: false,
  frontOfficeActivationPerformed: false,
  rollbackRequiredOnFailure: true,
  persistenceWriteAllowed: false,
  legacySourceDeletionAllowed: false,
  blockers: Object.freeze([])
});

const contract = createFrontOfficeCutoverTransactionContract(preflight);
assert.strictEqual(contract.ready, true);
assert.strictEqual(contract.slotId, 'mission74');
assert.strictEqual(contract.activationMustBeAtomic, true);
assert.strictEqual(contract.activationMustBeReversible, true);
assert.strictEqual(contract.postActivationVerificationRequired, true);
assert.strictEqual(contract.legacyRuntimeMustRemainRecoverable, true);
assert.strictEqual(contract.sourceSelectorRequired, true);
assert.strictEqual(contract.frontOfficeActivationAllowed, false);
assert.strictEqual(contract.frontOfficeActivationPerformed, false);
assert.strictEqual(contract.persistenceWriteAllowed, false);
assert.strictEqual(contract.legacySourceDeletionAllowed, false);
assert.deepStrictEqual(contract.blockers, []);

const invalid = createFrontOfficeCutoverTransactionContract(null);
assert.strictEqual(invalid.ready, false);
assert(invalid.blockers.includes('Front Office GameState cutover preflight is required'));

const noRecovery = createFrontOfficeCutoverTransactionContract(Object.freeze({
  ...preflight,
  recoveryCheckpointVerified: false
}));
assert.strictEqual(noRecovery.ready, false);
assert(noRecovery.blockers.includes('Verified recovery checkpoint is required'));

const noRollback = createFrontOfficeCutoverTransactionContract(Object.freeze({
  ...preflight,
  rollbackRequiredOnFailure: false
}));
assert.strictEqual(noRollback.ready, false);
assert(noRollback.blockers.includes('Rollback-on-failure guarantee is required'));

const alreadyActivated = createFrontOfficeCutoverTransactionContract(Object.freeze({
  ...preflight,
  frontOfficeActivationPerformed: true
}));
assert.strictEqual(alreadyActivated.ready, false);
assert(alreadyActivated.blockers.includes('Front Office must not already be activated'));

console.log('Front Office GameState cutover transaction contract tests passed.');
