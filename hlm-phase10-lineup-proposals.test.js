'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createSimulationLineupProposals: propose } = require('./hlm-phase10-lineup-proposals');

const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players: [
    { id: 10, teamId: 1, position: 'C', ovr: 80 },
    { id: 11, teamId: 1, position: 'C', ovr: 90 },
    { id: 12, teamId: 1, position: 'LW', ovr: 80 },
    { id: 13, teamId: 1, position: 'RW', ovr: 80 },
    { id: 14, teamId: 1, position: 'D', ovr: 85 },
    { id: 15, teamId: 1, position: 'D', ovr: 85 },
    { id: 16, teamId: 1, position: 'G', ovr: 91 },
    { id: 17, teamId: 1, position: 'G', ovr: 60 },
    { id: 18, teamId: 1, position: 'D', ovr: 95, retired: true },
    { id: 19, teamId: -1, position: 'G', ovr: 99 },
    { id: 20, teamId: 2, position: 'C', ovr: 75 }
  ]
});
const original = JSON.stringify(state);
const result = propose(state);
assert.equal(result.kind, 'phase10-lineup-proposals');
assert.deepEqual(result.slotDefinition, { skaters: ['C', 'LW', 'RW', 'D', 'D'], goalies: 1 });
assert.deepEqual(result.teams[0].skaterSlots.map(s => s.playerId), [11, 12, 13, 14, 15]);
assert.equal(result.teams[0].goalieSlot.playerId, 16);
assert.deepEqual(result.teams[0].benchPlayerIds, [10, 17]);
assert.deepEqual(result.teams[0].excludedPlayerIds, [18]);
assert.equal(result.teams[0].proposalComplete, true);
assert.deepEqual(result.teams[1].missingSlots, ['LW', 'RW', 'D', 'D', 'G']);
assert.equal(result.teams[1].proposalComplete, false);
assert.deepEqual(result.unresolvedPlayers, [{ playerId: 19, teamId: -1 }]);
for (const flag of ['lineupAuthorized', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
assert.equal(result.teams[0].lineupAuthorized, false);
assert.equal(JSON.stringify(state), original);
assert.deepEqual(propose(state), result);
result.teams[0].skaterSlots[0].playerId = 999;
result.slotDefinition.skaters.push('G');
assert.deepEqual(propose(state).teams[0].skaterSlots.map(s => s.playerId), [11, 12, 13, 14, 15]);
assert.equal(JSON.stringify(state), original);
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 2;
assert.throws(() => propose(invalid), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 722 lineup proposal tests passed.');
