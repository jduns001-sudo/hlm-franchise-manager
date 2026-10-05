'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createIsolatedGameStateRuntime } = require('./hlm-isolated-gamestate-runtime');
const {
  bindFrontOfficeCutoverCandidate,
  verifyBoundFrontOfficeCutoverCandidate
} = require('./hlm-front-office-cutover-candidate-binding');

const state = createGameStateEnvelope({
  meta: { saveId: 'mission80', controlledTeamId: 'PIT' },
  players: [{ id: 'p1' }],
  teams: [{ id: 'PIT' }],
  contracts: [{ id: 'c1' }],
  draftPicks: [{ id: 'd1' }],
  transactions: [{ id: 't1' }]
});

const contract = {
  kind: 'front-office-gamestate-cutover-transaction-contract',
  ready: true,
  slotId: 'slot-80'
};
const activationVerification = {
  kind: 'isolated-gamestate-activation-verification',
  verified: true,
  stateMatches: true,
  slotId: 'slot-80'
};
const compatibilityVerification = {
  kind: 'front-office-projection-compatibility-verification',
  compatible: true
};

const binding = bindFrontOfficeCutoverCandidate(
  contract,
  activationVerification,
  compatibilityVerification,
  state
);
assert.strictEqual(binding.bound, true);
assert.strictEqual(binding.slotId, 'slot-80');
assert.strictEqual(binding.exactCandidateRequired, true);
assert.strictEqual(binding.frontOfficeActivationAllowed, false);
assert.strictEqual(binding.liveFrontOfficeWiringPerformed, false);

const runtime = createIsolatedGameStateRuntime();
runtime.activate(state, {
  kind: 'browser-gamestate-activation-authorization',
  authorized: true,
  slotId: 'slot-80',
  state
});
const verified = verifyBoundFrontOfficeCutoverCandidate(binding, runtime);
assert.strictEqual(verified.verified, true);
assert.strictEqual(verified.exactStateMatch, true);
assert.strictEqual(verified.frontOfficeActivationAllowed, false);

const altered = createGameStateEnvelope({
  meta: { saveId: 'mission80', controlledTeamId: 'PIT' },
  players: [{ id: 'different-player' }],
  teams: [{ id: 'PIT' }],
  contracts: [{ id: 'c1' }],
  draftPicks: [{ id: 'd1' }],
  transactions: [{ id: 't1' }]
});
const alteredRuntime = createIsolatedGameStateRuntime();
alteredRuntime.activate(altered, {
  kind: 'browser-gamestate-activation-authorization',
  authorized: true,
  slotId: 'slot-80',
  state: altered
});
const mismatch = verifyBoundFrontOfficeCutoverCandidate(binding, alteredRuntime);
assert.strictEqual(mismatch.verified, false);
assert.strictEqual(mismatch.exactStateMatch, false);
assert.ok(mismatch.blockers.includes('Runtime GameState does not match exact bound cutover candidate'));

const wrongSlot = bindFrontOfficeCutoverCandidate(
  contract,
  { ...activationVerification, slotId: 'slot-other' },
  compatibilityVerification,
  state
);
assert.strictEqual(wrongSlot.bound, false);
assert.ok(wrongSlot.blockers.includes('Cutover contract slot does not match verified activation slot'));

console.log('Front Office cutover candidate binding tests passed.');
