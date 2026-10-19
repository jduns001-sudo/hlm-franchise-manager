'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterGamePreviewGate: gate } = require('./hlm-phase10-roster-game-preview-gate');

const teams = [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }];
const positions = ['C', 'LW', 'RW', 'D', 'D', 'G'];
const players = teams.flatMap(team => positions.map((position, i) => ({
  id: team.id * 100 + i, teamId: team.id, position, ovr: 76 + i
})));
const contracts = players.map(p => ({ playerId: p.id, teamId: p.teamId, status: 'Active' }));
const injuries = players.map(p => ({ playerId: p.id, status: 'Recovered' }));
const state = createGameStateEnvelope({ teams, players, contracts, injuries });
const before = JSON.stringify(state);
const result = gate(state, 1, 2, 42);
assert.equal(result.kind, 'phase10-roster-game-preview-gate');
assert.equal(result.previewAvailable, true);
assert.equal(typeof result.projectedScore.homeGoals, 'number');
assert.equal(typeof result.projectedScore.awayGoals, 'number');
assert.deepEqual(result.blockers, [{ side: 'both', code: 'OFFICIAL_ELIGIBILITY_NOT_CERTIFIED' }]);
assert.deepEqual(gate(state, 1, 2, 42), result);
for (const key of ['resultOfficial', 'eligibilityCertified', 'lineupAuthorized',
  'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[key], false);
}
assert.equal(JSON.stringify(state), before);
const incomplete = createGameStateEnvelope({
  teams, players: players.filter(p => p.teamId === 1), contracts, injuries
});
const blocked = gate(incomplete, 1, 2, 42);
assert.equal(blocked.previewAvailable, false);
assert.equal(blocked.projectedScore, null);
assert(blocked.blockers.some(b => b.side === 'away' && b.code === 'MISSING_LINEUP_SLOTS'));
assert(blocked.blockers.some(b => b.code === 'OFFICIAL_ELIGIBILITY_NOT_CERTIFIED'));
assert.equal(blocked.simulationAuthorized, false);
assert.throws(() => gate(state, 1, 1), { code: 'INVALID_PHASE10_MATCHUP_TEAM_IDS' });
assert.throws(() => gate(state, 1, 999), { code: 'UNKNOWN_PHASE10_MATCHUP_TEAM_ID' });
const invalid = createGameStateEnvelope();
invalid.schemaVersion = 99;
assert.throws(() => gate(invalid, 1, 2), { code: 'INVALID_FRANCHISE_BRIDGE_STATE' });
console.log('Mission 739 roster game preview gate tests passed.');
