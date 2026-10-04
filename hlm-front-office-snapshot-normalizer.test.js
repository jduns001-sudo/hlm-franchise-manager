'use strict';
const assert = require('assert');
const { normalizeFrontOfficeSnapshot } = require('./hlm-front-office-snapshot-normalizer');

(() => {
  const source = {
    schema: 7,
    settings: { controlledTeamId: 5 },
    players: [{ id: 1 }],
    teams: [{ id: 5 }],
    contracts: [{ id: 'CON-1' }],
    transactions: [{ id: 'TXN-1' }],
    draftPicks: [{ year: 2027, round: 1 }],
    playerOverrides: { 1: { overall: 90 } },
    extraDraftPicks: [{ year: 2028, round: 2 }],
    customPlayers: [{ id: 900001 }],
    franchiseName: 'Test Franchise'
  };

  const result = normalizeFrontOfficeSnapshot(source);
  assert.strictEqual(result.readOnly, true);
  assert.strictEqual(result.sourceSchema, 7);
  assert.strictEqual(result.state.settings.controlledTeamId, 5);
  assert.strictEqual(result.state.players.length, 1);
  assert.strictEqual(result.state.lines.length, 0);
  assert.strictEqual(result.state.franchiseName, 'Test Franchise');

  result.state.players[0].id = 99;
  result.state.settings.controlledTeamId = 99;
  assert.strictEqual(source.players[0].id, 1);
  assert.strictEqual(source.settings.controlledTeamId, 5);

  assert.throws(
    () => normalizeFrontOfficeSnapshot(null),
    e => e && e.code === 'INVALID_FRONT_OFFICE_SNAPSHOT'
  );

  console.log('Front Office snapshot normalizer tests passed.');
})();
