'use strict';
const assert = require('node:assert/strict');
const { createCanonicalFranchiseBridgeSnapshot } = require('./hlm-canonical-franchise-bridge');
const { assessSimulationRosterEligibility } = require('./hlm-simulation-roster-eligibility');

const universe = {
  teams: [{ id: 10, name: 'Wolves' }, { id: 20, name: 'Falcons' }],
  players: [
    { id: 1, teamId: 10, retired: false },
    { id: 2, teamId: 10, retired: true },
    { id: 3, teamId: -1, retired: false },
    { id: 4, teamId: 0, retired: false },
    { id: 5, teamId: 100, retired: true },
    { id: 6, teamId: 3515531, retired: false },
    { id: 7, teamId: 20, retired: false }
  ]
};
const roster = { players: [{ id: 1, teamId: 20 }, { id: 1, teamId: 20 }] };
const before = JSON.stringify({ universe, roster });
const bridge = createCanonicalFranchiseBridgeSnapshot(universe, roster);
const bridgeBefore = JSON.stringify({ teams: bridge.teams, players: bridge.players });
const result = assessSimulationRosterEligibility(bridge);
assert.equal(JSON.stringify({ universe, roster }), before);
assert.equal(JSON.stringify({ teams: bridge.teams, players: bridge.players }), bridgeBefore);
assert.deepEqual(result.players.map(p => p.assessment), [
  'candidate', 'excluded', 'undetermined', 'undetermined', 'excluded', 'undetermined', 'candidate'
]);
assert.deepEqual(result.counts, { candidate: 2, excluded: 2, undetermined: 3 });
assert.deepEqual(result.teams.find(t => t.teamId === 10).associatedPlayerIds, [1, 2]);
assert.deepEqual(result.teams.find(t => t.teamId === 10).candidatePlayerIds, [1]);
assert.deepEqual(result.teams.find(t => t.teamId === 10).excludedPlayerIds, [2]);
assert.deepEqual(result.teams.find(t => t.teamId === 20).candidatePlayerIds, [7]);
assert.equal(result.players[0].gameEligible, null, 'team association never proves game eligibility');
assert.equal(result.players[0].lineupEligible, null);
assert.equal(result.players[2].organizationStatus, 'sentinel-no-team');
assert.equal(result.players[3].organizationStatus, 'sentinel-unassigned');
assert.equal(result.players[4].organizationStatus, 'sentinel-legacy-unknown');
assert.equal(result.players[5].organizationStatus, 'external-organization-unresolved');
assert(result.players[1].reasons.includes('RETIRED_PLAYER'));
assert.equal(result.sourceStateMutated, false);
assert.equal(result.persistencePerformed, false);
result.teams[0].candidatePlayerIds.push(999);
assert.deepEqual(bridge.teams.find(t => t.id === 10).playerIds, [1, 2]);

const override = createCanonicalFranchiseBridgeSnapshot(universe, roster, { playerOverrides: { 3: { teamId: 20 } } });
assert.equal(assessSimulationRosterEligibility(override).players.find(p => p.playerId === 3).assessment, 'candidate');

assert.throws(() => assessSimulationRosterEligibility({}), { code: 'INVALID_ROSTER_ELIGIBILITY_INPUT' });
assert.throws(() => assessSimulationRosterEligibility({ teams: [], players: [{ id: 1 }] }), { code: 'MISSING_PLAYER_ORGANIZATION_CLASSIFICATION' });
console.log('Mission 666 roster eligibility assessment tests passed.');
