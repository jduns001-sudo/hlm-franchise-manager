'use strict';
const assert = require('assert');
const { evaluateFrontOfficeLiveCutoverReadiness } = require('./hlm-front-office-live-cutover-readiness');

const bindingVerification = Object.freeze({
  kind: 'front-office-cutover-candidate-binding-verification',
  verified: true,
  slotId: 'slot-83',
  exactStateMatch: true,
  blockers: Object.freeze([])
});

const dryRun = Object.freeze({
  kind: 'front-office-cutover-dry-run',
  verified: true,
  slotId: 'slot-83',
  beganOnLegacy: true,
  exactCandidateSelected: true,
  projectionMatched: true,
  rollbackPerformed: true,
  legacyRestored: true,
  finalSource: 'legacy',
  blockers: Object.freeze([])
});

const ready = evaluateFrontOfficeLiveCutoverReadiness(bindingVerification, dryRun);
assert.strictEqual(ready.ready, true);
assert.strictEqual(ready.slotId, 'slot-83');
assert.strictEqual(ready.exactCandidateVerified, true);
assert.strictEqual(ready.dryRunVerified, true);
assert.strictEqual(ready.rollbackVerified, true);
assert.strictEqual(ready.projectionVerified, true);
assert.strictEqual(ready.liveWiringMissionMayBePrepared, true);
assert.strictEqual(ready.frontOfficeActivationAllowed, false);
assert.strictEqual(ready.frontOfficeActivationPerformed, false);
assert.strictEqual(ready.liveFrontOfficeWiringPerformed, false);

const wrongSlot = evaluateFrontOfficeLiveCutoverReadiness(
  bindingVerification,
  { ...dryRun, slotId: 'other-slot' }
);
assert.strictEqual(wrongSlot.ready, false);
assert.ok(wrongSlot.blockers.includes('Bound candidate and cutover dry-run slots do not match'));

const failedRollback = evaluateFrontOfficeLiveCutoverReadiness(
  bindingVerification,
  { ...dryRun, verified: false, rollbackPerformed: false, legacyRestored: false,
    finalSource: 'gamestate', blockers: ['rollback failed'] }
);
assert.strictEqual(failedRollback.ready, false);
assert.strictEqual(failedRollback.liveWiringMissionMayBePrepared, false);
assert.ok(failedRollback.blockers.includes('rollback failed'));
assert.ok(failedRollback.blockers.includes('Cutover dry run rollback is required'));
assert.ok(failedRollback.blockers.includes('Legacy Front Office restoration is required'));
assert.ok(failedRollback.blockers.includes('Cutover dry run must finish on legacy'));

const failedBinding = evaluateFrontOfficeLiveCutoverReadiness(
  { ...bindingVerification, verified: false, exactStateMatch: false, blockers: ['candidate mismatch'] },
  dryRun
);
assert.strictEqual(failedBinding.ready, false);
assert.ok(failedBinding.blockers.includes('candidate mismatch'));
assert.ok(failedBinding.blockers.includes('Exact bound GameState candidate match is required'));

console.log('Front Office live cutover readiness tests passed.');
