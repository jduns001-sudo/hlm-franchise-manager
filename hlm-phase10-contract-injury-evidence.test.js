'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { assessPlayerContractInjuryEvidence: assess } = require('./hlm-phase10-contract-injury-evidence');

const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players: [
    { id: 10, teamId: 1, position: 'C', ovr: 80 },
    { id: 11, teamId: 1, position: 'G', ovr: 76 },
    { id: 12, teamId: 1, position: 'D', ovr: 74 },
    { id: 13, teamId: 1, position: 'RW', ovr: 71, retired: true },
    { id: 14, teamId: 2, position: 'LW', ovr: 77 }
  ],
  contracts: [
    { playerId: 10, teamId: 1, status: 'Active' },
    { playerId: 11, teamId: 2, status: 'Active' },
    { playerId: 12, teamId: 1, status: 'Signed' },
    { playerId: 12, teamId: 1, status: 'Active' }
  ],
  injuries: [
    { playerId: 10, status: 'Recovered' },
    { playerId: 11, status: 'Active' },
    { playerId: 12, status: 'Unknown' }
  ]
});
const before = JSON.stringify(state);
const result = assess(state);
const players = result.teams[0].players;
assert.deepEqual(players.map(p => p.playerId), [10, 11, 12, 13]);
assert.deepEqual(players.map(p => p.contractEvidence), [
  'active-team-contract', 'conflicting', 'conflicting', 'unverified'
]);
assert.deepEqual(players.map(p => p.injuryEvidence), [
  'no-active-injury-recorded', 'active-injury', 'unverified', 'unverified'
]);
assert.deepEqual(players.map(p => p.blockers), [
  [], ['CONTRACT_CONFLICT', 'ACTIVE_INJURY'], ['CONTRACT_CONFLICT'],
  ['BASELINE_CANDIDATE_EXCLUDED']
]);
assert.equal(result.teams[1].players[0].contractEvidence, 'unverified');
for (const flag of ['eligibilityCertified', 'lineupAuthorized', 'simulationAuthorized',
  'sourceStateMutated', 'persistencePerformed']) assert.equal(result[flag], false);
assert.equal(JSON.stringify(state), before);
assert.deepEqual(assess(state), result);
players[0].blockers.push('TAMPER');
assert.equal(JSON.stringify(state), before);
assert.deepEqual(assess(state).teams[0].players[0].blockers, []);
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 999;
assert.throws(() => assess(invalid), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 735 contract injury evidence tests passed.');
