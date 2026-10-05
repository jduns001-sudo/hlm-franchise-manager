'use strict';
const assert = require('assert');
const { evaluateFrontOfficeCutoverPreflight } = require('./hlm-front-office-gamestate-cutover-preflight');

const authorization = Object.freeze({
  kind: 'front-office-gamestate-source-authorization',
  version: 1,
  ready: true,
  authorizationRequested: true,
  authorized: true,
  gameStateSourceOfTruthAuthorized: true,
  frontOfficeActivationAllowed: true,
  frontOfficeActivationPerformed: false,
  slotId: 'mission73',
  isolatedActivationVerified: true,
  legacyRuntimeReadable: true,
  legacyRuntimeReadOnly: true,
  persistenceWriteAllowed: false,
  legacySourceDeletionAllowed: false,
  blockers: Object.freeze([])
});

const checkpoint = Object.freeze({
  kind: 'browser-migration-recovery-checkpoint',
  version: 1,
  verified: true,
  legacyValue: '{"schema":7}',
  gameStateSaveValue: '{"slots":{}}'
});

const ready = evaluateFrontOfficeCutoverPreflight(authorization, checkpoint);
assert.strictEqual(ready.ready, true);
assert.strictEqual(ready.transactionReady, true);
assert.strictEqual(ready.slotId, 'mission73');
assert.strictEqual(ready.sourceAuthorized, true);
assert.strictEqual(ready.recoveryCheckpointVerified, true);
assert.strictEqual(ready.frontOfficeActivationAllowed, false);
assert.strictEqual(ready.frontOfficeActivationPerformed, false);
assert.strictEqual(ready.rollbackRequiredOnFailure, true);
assert.strictEqual(ready.persistenceWriteAllowed, false);
assert.strictEqual(ready.legacySourceDeletionAllowed, false);
assert.deepStrictEqual(ready.blockers, []);

const noAuthorization = evaluateFrontOfficeCutoverPreflight(null, checkpoint);
assert.strictEqual(noAuthorization.ready, false);
assert(noAuthorization.blockers.includes('Front Office GameState source authorization is required'));

const denied = evaluateFrontOfficeCutoverPreflight(Object.freeze({
  ...authorization,
  authorized: false,
  blockers: Object.freeze(['authorization denied'])
}), checkpoint);
assert.strictEqual(denied.ready, false);
assert(denied.blockers.includes('authorization denied'));

const noCheckpoint = evaluateFrontOfficeCutoverPreflight(authorization, null);
assert.strictEqual(noCheckpoint.ready, false);
assert(noCheckpoint.blockers.includes('Verified browser migration recovery checkpoint is required'));

const unverifiedCheckpoint = evaluateFrontOfficeCutoverPreflight(authorization, Object.freeze({
  ...checkpoint,
  verified: false
}));
assert.strictEqual(unverifiedCheckpoint.ready, false);
assert(unverifiedCheckpoint.blockers.includes('Verified browser migration recovery checkpoint is required'));

const alreadyActivated = evaluateFrontOfficeCutoverPreflight(Object.freeze({
  ...authorization,
  frontOfficeActivationPerformed: true
}), checkpoint);
assert.strictEqual(alreadyActivated.ready, false);
assert(alreadyActivated.blockers.includes('Front Office must not already be activated'));

console.log('Front Office GameState cutover preflight tests passed.');
