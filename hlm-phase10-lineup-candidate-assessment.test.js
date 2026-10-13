'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { assessSimulationLineupCandidates: assess } = require('./hlm-phase10-lineup-candidate-assessment');

const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players: [
    { id: 10, teamId: 1, position: 'C', ovr: 82 },
    { id: 11, teamId: 1, position: 'G', ovr: 75 },
    { id: 12, teamId: 1, position: 'D', ovr: 65, retired: true },
    { id: 13, teamId: 1, position: 'X', ovr: 70 },
    { id: 14, teamId: 1, position: 'LW', ovr: 110 },
    { id: 15, teamId: 2, position: 'RW', ovr: 78 },
    { id: 16, teamId: -1, position: 'D', ovr: 88 },
    { id: 17, teamId: 0, position: 'G', ovr: 70 },
    { id: 18, teamId: 100, position: 'C', ovr: 67 },
    { id: 19, teamId: 999, position: 'LW', ovr: 71 }
  ]
});
const original = JSON.stringify(state);
const result = assess(state);
assert.equal(result.kind, 'phase10-lineup-candidate-assessment');
assert.deepEqual(result.teams.map(t => t.candidates.map(p => p.playerId)), [[10, 11], [15]]);
assert.deepEqual(result.teams[0].excluded.map(p => [p.playerId, p.reasons]), [
  [12, ['RETIRED']], [13, ['POSITION_UNKNOWN']], [14, ['OVERALL_INVALID']]
]);
assert.deepEqual(result.unresolvedPlayers.map(p => [p.playerId, p.teamId]),
  [[16, -1], [17, 0], [18, 100], [19, 999]]);
assert.equal(result.teams[0].candidateCount, 2);
assert.equal(result.teams[0].excludedCount, 3);
assert.equal(result.teams[0].lineupReady, null);
assert.equal(result.validation.valid, false);
for (const flag of ['lineupAuthorized', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
assert.equal(JSON.stringify(state), original);
assert.deepEqual(assess(state), result);
result.teams[0].candidates[0].overall = 0;
result.teams[0].excluded[0].reasons.push('TAMPER');
result.unresolvedPlayers[0].teamId = 1;
assert.equal(JSON.stringify(state), original);
assert.equal(assess(state).teams[0].candidates[0].overall, 82);
assert.deepEqual(assess(state).teams[0].excluded[0].reasons, ['RETIRED']);
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 99;
assert.throws(() => assess(invalid), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 721 lineup candidate assessment tests passed.');
