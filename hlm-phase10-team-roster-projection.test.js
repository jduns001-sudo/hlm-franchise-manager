'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createSimulationTeamRosterProjection: project } = require('./hlm-phase10-team-roster-projection');

const state = createGameStateEnvelope({
  teams: [{ id: 11, name: 'Wolves' }, { id: 22, name: 'Bears' }],
  players: [
    { id: 101, teamId: 11, position: 'C', ovr: 82 },
    { id: 102, teamId: 22, position: 'G', ovr: 77 },
    { id: 103, teamId: -1, position: 'D', ovr: 75 },
    { id: 104, teamId: 999, position: 'LW', ovr: 70 },
    { id: 105, teamId: 0, position: 'C', ovr: 67 },
    { id: 106, teamId: 100, position: 'RW', ovr: 66 }
  ]
});
const before = JSON.stringify(state);
const result = project(state);
assert.equal(result.kind, 'phase10-team-roster-projection');
assert.deepEqual(result.teams.map(t => t.teamId), [11, 22]);
assert.deepEqual(result.teams.map(t => t.playerIds), [[101], [102]]);
assert.deepEqual(result.teams[0].players[0], {
  playerId: 101, teamId: 11, position: 'C', overall: 82, retired: false
});
assert.deepEqual(result.unresolvedPlayers.map(p => [p.playerId, p.teamId]),
  [[103, -1], [104, 999], [105, 0], [106, 100]]);
assert.equal(result.validation.valid, false);
assert.equal(result.validation.issueCount, 4);
for (const flag of ['lineupAuthorized', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
assert.equal(JSON.stringify(state), before);
assert.deepEqual(project(state), result);
result.teams[0].players[0].overall = 0;
result.unresolvedPlayers[0].teamId = 11;
assert.equal(JSON.stringify(state), before);
assert.equal(project(state).teams[0].players[0].overall, 82);
const invalid = createGameStateEnvelope({ teams: [], players: [] });
invalid.schemaVersion = 999;
assert.throws(() => project(invalid), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 720 team roster projection tests passed.');
