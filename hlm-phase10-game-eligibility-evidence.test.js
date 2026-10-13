'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createGameEligibilityEvidence: assess } = require('./hlm-phase10-game-eligibility-evidence');

const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players: [
    { id: 10, teamId: 1, position: 'C', ovr: 82 },
    { id: 11, teamId: 1, position: 'LW', ovr: 80 },
    { id: 12, teamId: 1, position: 'RW', ovr: 78 },
    { id: 13, teamId: 1, position: 'D', ovr: 77 },
    { id: 14, teamId: 1, position: 'D', ovr: 75 },
    { id: 15, teamId: 1, position: 'G', ovr: 83 },
    { id: 16, teamId: 2, position: 'C', ovr: 70 },
    { id: 17, teamId: -1, position: 'G', ovr: 90 }
  ],
  contracts: [
    { playerId: 10, teamId: 1, status: 'Active' },
    { playerId: 11, teamId: 2, status: 'Active' },
    { playerId: 12, teamId: 1, status: 'Signed' },
    { playerId: 13, teamId: 1, status: 'Active' },
    { playerId: 14, teamId: 1, status: 'Active' },
    { playerId: 15, teamId: 1, status: 'Active' }
  ],
  injuries: [
    { playerId: 10, status: 'Recovered' },
    { playerId: 12, status: 'Active' },
    { playerId: 13, status: 'Unknown' },
    { playerId: 14, status: 'Recovered' },
    { playerId: 15, status: 'Recovered' }
  ]
});
const before = JSON.stringify(state);
const result = assess(state);
assert.equal(result.kind, 'phase10-game-eligibility-evidence');
const team = result.teams[0];
assert.deepEqual(team.slots.map(slot => slot.playerId), [10, 11, 12, 13, 14, 15]);
assert.deepEqual(team.slots.map(slot => slot.status), [
  'evidence-complete', 'blocked-or-unverified', 'blocked-or-unverified',
  'blocked-or-unverified', 'evidence-complete', 'evidence-complete'
]);
assert.deepEqual(team.slots[1].blockers, ['CONTRACT_CONFLICT', 'CONTRACT_NOT_VERIFIED',
  'INJURY_CLEARANCE_NOT_VERIFIED']);
assert.deepEqual(team.slots[2].blockers, ['ACTIVE_INJURY', 'INJURY_CLEARANCE_NOT_VERIFIED']);
assert.deepEqual(team.slots[3].blockers, ['INJURY_CLEARANCE_NOT_VERIFIED']);
assert.equal(team.evidenceCompleteCount, 3);
assert.equal(team.blockedOrUnverifiedCount, 3);
assert.equal(team.gameEligible, null);
assert.equal(result.teams[1].slots.filter(s => s.status === 'missing').length, 5);
assert.equal(result.teams[1].slots[0].status, 'blocked-or-unverified');
for (const flag of ['eligibilityCertified', 'lineupAuthorized', 'simulationAuthorized',
  'sourceStateMutated', 'persistencePerformed']) assert.equal(result[flag], false);
assert.equal(JSON.stringify(state), before);
assert.deepEqual(assess(state), result);
team.slots[1].blockers.push('TAMPER');
assert.equal(JSON.stringify(state), before);
assert(!JSON.stringify(assess(state)).includes('TAMPER'));
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 999;
assert.throws(() => assess(invalid), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 736 game eligibility evidence tests passed.');
