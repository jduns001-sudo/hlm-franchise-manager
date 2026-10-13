'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterBackedMatchupPreview: preview } = require('./hlm-phase10-roster-matchup-preview');

const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players: [
    ...['C', 'LW', 'RW', 'D', 'D', 'G'].map((position, i) =>
      ({ id: 10 + i, teamId: 1, position, ovr: 80 + i })),
    { id: 20, teamId: 2, position: 'C', ovr: 75 },
    { id: 30, teamId: -1, position: 'G', ovr: 99 }
  ],
  contracts: [...Array.from({ length: 6 }, (_, i) =>
    ({ playerId: 10 + i, teamId: 1, status: 'Active' }))],
  injuries: [...Array.from({ length: 6 }, (_, i) =>
    ({ playerId: 10 + i, status: 'Recovered' }))]
});
const before = JSON.stringify(state);
const result = preview(state, 1, 2);
assert.equal(result.kind, 'phase10-roster-backed-matchup-preview');
assert.equal(result.home.teamId, 1);
assert.equal(result.away.teamId, 2);
assert.deepEqual(result.home.proposedPlayerIds, [10, 11, 12, 14, 13, 15]);
assert.equal(result.home.proposedRatingSum, 495);
assert.equal(result.home.proposedRatingCount, 6);
assert.equal(result.home.evidenceCompleteCount, 6);
assert.equal(result.home.blockedOrUnverifiedCount, 0);
assert.deepEqual(result.away.missingSlots, ['LW', 'RW', 'D', 'D', 'G']);
assert.equal(result.away.proposedRatingSum, 75);
assert.equal(result.away.blockedOrUnverifiedCount, 6);
assert.equal(result.home.gameEligible, null);
assert.equal(result.away.gameEligible, null);
for (const flag of ['scorePredicted', 'eligibilityCertified', 'lineupAuthorized',
  'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
assert.equal(JSON.stringify(state), before);
assert.deepEqual(preview(state, 1, 2), result);
result.home.proposedPlayerIds.push(999);
result.home.slotEvidence[0].blockers.push('TAMPER');
assert.equal(JSON.stringify(state), before);
assert(!JSON.stringify(preview(state, 1, 2)).includes('TAMPER'));
for (const pair of [[1, 1], [1, 0], [-1, 2], [1, 1.5]]) {
  assert.throws(() => preview(state, ...pair), { code: 'INVALID_PHASE10_MATCHUP_TEAM_IDS' });
}
assert.throws(() => preview(state, 1, 999), { code: 'UNKNOWN_PHASE10_MATCHUP_TEAM_ID' });
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 99;
assert.throws(() => preview(invalid, 1, 2), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 737 roster matchup preview tests passed.');
