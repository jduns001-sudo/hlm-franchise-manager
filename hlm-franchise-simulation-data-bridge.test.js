'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createFranchiseSimulationSnapshot } = require('./hlm-franchise-simulation-data-bridge');

const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Falcons' }],
  players: [
    { id: 10, teamId: 1, position: 'C', ovr: 82 },
    { id: 11, teamId: 1, retired: true },
    { id: 12, teamId: 3515531 },
    { id: 13, teamId: -1 },
    { id: 14, teamId: 0 },
    { id: 15, teamId: 100 },
    { id: 10, teamId: 2 }
  ]
});
const before = JSON.stringify(state);
const snapshot = createFranchiseSimulationSnapshot(state);
assert.equal(JSON.stringify(state), before, 'source GameState must not mutate');
assert.deepEqual(snapshot.teams.map(t => t.id), [1, 2]);
assert.deepEqual(snapshot.teams[0].playerIds, [10, 11]);
assert.deepEqual(snapshot.teams[1].playerIds, []);
assert.equal(snapshot.players.length, 6, 'duplicate canonical ID must not become a second player');
assert.equal(snapshot.players[0].overall, 82);
assert.equal(snapshot.players[2].teamId, 3515531, 'unknown organization ID must be preserved');
assert.equal(snapshot.players[3].teamId, -1);
assert.equal(snapshot.players[4].teamId, 0);
assert.equal(snapshot.players[5].teamId, 100);
assert(snapshot.diagnostics.some(d => d.code === 'DUPLICATE_PLAYER_ID' && d.playerId === 10));
assert.equal(snapshot.diagnostics.filter(d => d.code === 'UNRESOLVED_PLAYER_TEAM_REFERENCE').length, 4);
assert.equal(snapshot.validation.valid, false);
assert.equal(snapshot.persistencePerformed, false);
assert.equal(snapshot.sourceStateMutated, false);
snapshot.teams[0].playerIds.push(999);
assert.equal(state.universe.teams[0].playerIds, undefined, 'snapshot must not alias source');

const clean = createFranchiseSimulationSnapshot(createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }],
  players: [{ id: 5, teamId: 1 }]
}));
assert.equal(clean.validation.valid, true);
assert.deepEqual(clean.teams[0].playerIds, [5]);

const badIds = createFranchiseSimulationSnapshot(createGameStateEnvelope({
  teams: [{ id: 1, name: 'One' }, { id: 1, name: 'Duplicate' }, { id: -1, name: 'Sentinel' }],
  players: [{ id: '20', teamId: 1 }, { id: 0, teamId: 1 }]
}));
assert(badIds.diagnostics.some(d => d.code === 'DUPLICATE_TEAM_ID'));
assert(badIds.diagnostics.some(d => d.code === 'INVALID_TEAM_ID'));
assert.equal(badIds.diagnostics.filter(d => d.code === 'INVALID_PLAYER_ID').length, 2);

assert.throws(() => createFranchiseSimulationSnapshot(null), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 662 read-only franchise simulation bridge tests passed.');
