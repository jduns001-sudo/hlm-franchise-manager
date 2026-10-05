'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');
const { createReversibleFrontOfficeSourceSelector } = require('./hlm-reversible-front-office-source-selector');
const { createBoundFrontOfficeSourceSelectorGuard } = require('./hlm-bound-front-office-source-selector-guard');

function legacyAdapter(state) {
  return Object.freeze({
    kind: 'front-office-read-only-runtime-adapter',
    async readLegacySnapshot() { return JSON.parse(JSON.stringify(state)); }
  });
}

function runtimeFor(state, slotId) {
  let current = JSON.parse(JSON.stringify(state));
  return {
    kind: 'isolated-gamestate-runtime',
    active: true,
    slotId,
    read() { return JSON.parse(JSON.stringify(current)); },
    replace(next) { current = JSON.parse(JSON.stringify(next)); }
  };
}

const state = createGameStateEnvelope({
  meta: { saveId: 'mission81', controlledTeamId: 'PIT' },
  players: [{ id: 'p1' }],
  teams: [{ id: 'PIT' }]
});
const slotId = 'slot-81';
const runtime = runtimeFor(state, slotId);
const contract = Object.freeze({
  kind: 'front-office-gamestate-cutover-transaction-contract',
  ready: true,
  slotId,
  sourceSelectorRequired: true,
  activationMustBeReversible: true
});
const selector = createReversibleFrontOfficeSourceSelector(
  legacyAdapter({ players: [{ id: 'legacy' }] }),
  runtime,
  contract
);
const binding = Object.freeze({
  kind: 'front-office-cutover-candidate-binding',
  bound: true,
  slotId,
  canonicalState: serializeGameState(state)
});
const verification = Object.freeze({
  kind: 'front-office-cutover-candidate-binding-verification',
  verified: true,
  exactStateMatch: true,
  slotId
});

const guard = createBoundFrontOfficeSourceSelectorGuard(selector, runtime, verification, binding);
assert.strictEqual(guard.source, 'legacy');
const selected = guard.selectGameState();
assert.strictEqual(selected.selected, true);
assert.strictEqual(selected.exactCandidateVerified, true);
assert.strictEqual(guard.source, 'gamestate');
assert.strictEqual(selected.liveFrontOfficeWiringPerformed, false);

const rollback = guard.rollbackToLegacy();
assert.strictEqual(rollback.rolledBack, true);
assert.strictEqual(guard.source, 'legacy');

const changedState = createGameStateEnvelope({
  meta: { saveId: 'mission81', controlledTeamId: 'PIT' },
  players: [{ id: 'different' }],
  teams: [{ id: 'PIT' }]
});
runtime.replace(changedState);
assert.throws(
  () => guard.selectGameState(),
  /Runtime GameState no longer matches exact bound cutover candidate/
);
assert.strictEqual(guard.source, 'legacy');

assert.throws(
  () => createBoundFrontOfficeSourceSelectorGuard(selector, runtime, { ...verification, verified: false }, binding),
  /Verified exact Front Office cutover candidate binding is required/
);

console.log('Bound Front Office source selector guard tests passed.');
