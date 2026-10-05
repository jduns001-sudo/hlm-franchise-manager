'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { projectGameStateForFrontOffice } = require('./hlm-front-office-gamestate-projection');
const { createFrontOfficeLiveWiringBoundary } = require('./hlm-front-office-live-wiring-boundary');

(async () => {
  const state = createGameStateEnvelope({
    meta: { saveId: 'mission84', controlledTeamId: 'PIT' },
    players: [{ id: 'p1' }],
    teams: [{ id: 'PIT' }],
    contracts: [{ id: 'c1' }]
  });
  const legacySnapshot = { players: [{ id: 'legacy-p1' }], gmSettings: { controlledTeamId: 'PIT' } };
  let source = 'legacy';

  const legacyAdapter = Object.freeze({
    kind: 'front-office-read-only-runtime-adapter',
    async readLegacySnapshot() { return JSON.parse(JSON.stringify(legacySnapshot)); }
  });

  const guardedSelector = {
    kind: 'bound-front-office-source-selector-guard',
    slotId: 'slot-84',
    get source() { return source; },
    async read() { return JSON.parse(JSON.stringify(state)); }
  };

  const readiness = Object.freeze({
    kind: 'front-office-live-cutover-readiness',
    ready: true,
    liveWiringMissionMayBePrepared: true,
    slotId: 'slot-84'
  });

  const boundary = createFrontOfficeLiveWiringBoundary({ readiness, legacyAdapter, guardedSelector });
  assert.strictEqual(boundary.liveWiringPrepared, true);
  assert.strictEqual(boundary.source, 'legacy');
  assert.deepStrictEqual(await boundary.readFrontOfficeSnapshot(), legacySnapshot);

  source = 'gamestate';
  assert.strictEqual(boundary.source, 'gamestate');
  assert.deepStrictEqual(await boundary.readFrontOfficeSnapshot(), projectGameStateForFrontOffice(state));

  assert.strictEqual(boundary.automaticGameStateSelectionAllowed, false);
  assert.strictEqual(boundary.frontOfficeActivationAllowed, false);
  assert.strictEqual(boundary.frontOfficeActivationPerformed, false);
  assert.strictEqual(boundary.persistenceWriteAllowed, false);
  assert.strictEqual(boundary.legacySourceDeletionAllowed, false);
  assert.strictEqual(boundary.liveFrontOfficeWiringPerformed, false);

  assert.throws(
    () => createFrontOfficeLiveWiringBoundary({
      readiness: { ...readiness, ready: false },
      legacyAdapter,
      guardedSelector
    }),
    /Verified Front Office live cutover readiness is required/
  );

  assert.throws(
    () => createFrontOfficeLiveWiringBoundary({
      readiness: { ...readiness, slotId: 'wrong-slot' },
      legacyAdapter,
      guardedSelector
    }),
    /slot must match verified cutover readiness/
  );

  console.log('Front Office live wiring boundary tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
