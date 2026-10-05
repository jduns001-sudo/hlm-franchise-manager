'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { serializeGameState } = require('./hlm-game-state-serialization');
const { projectGameStateForFrontOffice } = require('./hlm-front-office-gamestate-projection');
const { createReversibleFrontOfficeSourceSelector } = require('./hlm-reversible-front-office-source-selector');
const { createBoundFrontOfficeSourceSelectorGuard } = require('./hlm-bound-front-office-source-selector-guard');
const { runFrontOfficeCutoverDryRun } = require('./hlm-front-office-cutover-dry-run');

function legacyAdapter(state) {
  return Object.freeze({
    kind: 'front-office-read-only-runtime-adapter',
    async readLegacySnapshot() { return JSON.parse(JSON.stringify(state)); }
  });
}

function runtimeFor(state, slotId) {
  return Object.freeze({
    kind: 'isolated-gamestate-runtime',
    active: true,
    slotId,
    read() { return JSON.parse(JSON.stringify(state)); }
  });
}

(async () => {
  const state = createGameStateEnvelope({
    meta: { saveId: 'mission82', controlledTeamId: 'PIT' },
    players: [{ id: 'p1' }],
    teams: [{ id: 'PIT' }],
    prospects: [{ id: 'prospect1' }],
    contracts: [{ id: 'c1' }],
    draftPicks: [{ id: 'd1' }],
    transactions: [{ id: 't1' }]
  });
  const projection = projectGameStateForFrontOffice(state);
  const legacy = JSON.parse(JSON.stringify(projection));
  const slotId = 'slot-82';
  const adapter = legacyAdapter(legacy);
  const runtime = runtimeFor(state, slotId);
  const contract = Object.freeze({
    kind: 'front-office-gamestate-cutover-transaction-contract',
    ready: true,
    slotId,
    sourceSelectorRequired: true,
    activationMustBeReversible: true
  });
  const selector = createReversibleFrontOfficeSourceSelector(adapter, runtime, contract);
  const binding = Object.freeze({
    kind: 'front-office-cutover-candidate-binding',
    bound: true,
    slotId,
    canonicalState: serializeGameState(state)
  });
  const bindingVerification = Object.freeze({
    kind: 'front-office-cutover-candidate-binding-verification',
    verified: true,
    exactStateMatch: true,
    slotId
  });
  const guard = createBoundFrontOfficeSourceSelectorGuard(selector, runtime, bindingVerification, binding);

  const result = await runFrontOfficeCutoverDryRun({
    legacyAdapter: adapter,
    guardedSelector: guard,
    expectedProjection: projection
  });

  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.beganOnLegacy, true);
  assert.strictEqual(result.exactCandidateSelected, true);
  assert.strictEqual(result.projectionMatched, true);
  assert.strictEqual(result.rollbackPerformed, true);
  assert.strictEqual(result.legacyRestored, true);
  assert.strictEqual(result.finalSource, 'legacy');
  assert.strictEqual(result.frontOfficeActivationAllowed, false);
  assert.strictEqual(result.liveFrontOfficeWiringPerformed, false);

  const badProjection = JSON.parse(JSON.stringify(projection));
  badProjection.players.push({ id: 'wrong-player' });
  const failed = await runFrontOfficeCutoverDryRun({
    legacyAdapter: adapter,
    guardedSelector: guard,
    expectedProjection: badProjection
  });

  assert.strictEqual(failed.verified, false);
  assert.strictEqual(failed.projectionMatched, false);
  assert.strictEqual(failed.rollbackPerformed, true);
  assert.strictEqual(failed.legacyRestored, true);
  assert.strictEqual(failed.finalSource, 'legacy');
  assert.ok(failed.blockers.includes('Projected GameState read does not match expected Front Office projection'));

  console.log('Front Office cutover dry-run tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
