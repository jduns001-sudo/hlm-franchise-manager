'use strict';
const assert = require('assert');
const { auditFrontOfficeSnapshot } = require('./hlm-front-office-snapshot-audit');

(() => {
  const clean = auditFrontOfficeSnapshot({
    schema: 7,
    settings: { controlledTeamId: 5 },
    players: [{ id: 1 }, { id: 2 }],
    teams: [{ id: 5 }],
    contracts: [{}],
    transactions: [{}, {}],
    draftPicks: [{}],
    prospects: [{}]
  });
  assert.strictEqual(clean.readyForReadOnlyDiagnostics, true);
  assert.strictEqual(clean.blockers.length, 0);
  assert.strictEqual(clean.counts.players, 2);
  assert.strictEqual(clean.counts.transactions, 2);

  const duplicatePlayers = auditFrontOfficeSnapshot({
    schema: 7,
    players: [{ id: 1 }, { id: 1 }],
    teams: [{ id: 5 }]
  });
  assert.strictEqual(duplicatePlayers.readyForReadOnlyDiagnostics, false);
  assert.strictEqual(duplicatePlayers.duplicatePlayerIds, 1);
  assert(duplicatePlayers.warnings.some(x => /Controlled team/.test(x)));

  const duplicateTeams = auditFrontOfficeSnapshot({
    schema: 7,
    settings: { controlledTeamId: 5 },
    players: [],
    teams: [{ id: 5 }, { id: 5 }]
  });
  assert.strictEqual(duplicateTeams.duplicateTeamIds, 1);
  assert.strictEqual(duplicateTeams.readyForReadOnlyDiagnostics, false);

  console.log('Front Office snapshot audit tests passed.');
})();
