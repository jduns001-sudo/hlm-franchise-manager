'use strict';
const assert = require('node:assert/strict');
const { createCanonicalFranchiseBridgeSnapshot } = require('./hlm-canonical-franchise-bridge');

const universe = {
  teams: [{ id: 10, name: 'Wolves' }, { id: 20, name: 'Falcons' }],
  players: [
    { id: 1, first: 'A', last: 'One', teamId: 10, ovr: 70, potential: 78 },
    { id: 2, first: 'B', last: 'Two', teamId: -1, ovr: 68 }
  ]
};
const roster = { players: [
  { id: 1, ovr: 81, potential: 84, pos: 'C', teamId: 20 },
  { id: 1, ovr: 82, potential: 85, pos: 'LW', teamId: 20 },
  { id: 2, ovr: 72, pos: 'D' }
] };
const options = {
  playerFixes: { 1: { position: 'RW', potential: 86 } },
  playerOverrides: { 2: { teamId: 20, ovr: 76 } }
};
const before = JSON.stringify({ universe, roster, options });
const result = createCanonicalFranchiseBridgeSnapshot(universe, roster, options);
assert.equal(JSON.stringify({ universe, roster, options }), before, 'source inputs must not mutate');
assert.equal(result.players.length, 2, 'historical snapshots cannot create duplicate canonical players');
assert.deepEqual(result.teams.find(t => t.id === 10).playerIds, [1], 'roster teamId cannot override Universe teamId');
assert.deepEqual(result.teams.find(t => t.id === 20).playerIds, [2], 'explicit player override should take precedence');
assert.equal(result.players[0].overall, 82);
assert.equal(result.players[0].position, 'RW');
assert.equal(result.players[1].overall, 76);
assert.equal(result.provenanceByPlayerId.get(1).position.source, 'playerFix');
assert.equal(result.provenanceByPlayerId.get(2).teamId.source, 'playerOverride');
assert.equal(result.canonicalSummary.duplicateRosterIds, 1);
assert.equal(result.validation.valid, true);
assert.equal(result.persistencePerformed, false);
result.teams[0].playerIds.push(999);
result.provenanceByPlayerId.get(1).position.source = 'tampered';
assert.equal(universe.players[0].teamId, 10);

const unresolved = createCanonicalFranchiseBridgeSnapshot(
  { teams: [{ id: 10, name: 'Wolves' }], players: [{ id: 3, teamId: 3515531 }, { id: 4, teamId: 0 }, { id: 5, teamId: 100 }] },
  { players: [] }
);
assert.equal(unresolved.validation.valid, false);
assert.deepEqual(unresolved.players.map(p => p.teamId), [3515531, 0, 100]);
assert.equal(unresolved.diagnostics.filter(d => d.code === 'UNRESOLVED_PLAYER_TEAM_REFERENCE').length, 3);

const duplicate = createCanonicalFranchiseBridgeSnapshot(
  { teams: [{ id: 10, name: 'Wolves' }], players: [{ id: 7, teamId: 10 }, { id: 7, teamId: 10 }] },
  { players: [{ id: 999, ovr: 80 }] }
);
assert.equal(duplicate.players.length, 1);
assert.equal(duplicate.validation.valid, false);
assert(duplicate.diagnostics.some(d => d.code === 'DUPLICATE_UNIVERSE_PLAYER_ID'));
assert(duplicate.diagnostics.some(d => d.code === 'ROSTER_PLAYER_MISSING_UNIVERSE'));

console.log('Mission 663 canonical franchise bridge tests passed.');
