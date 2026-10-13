'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { assessLeagueParticipationReferences: assess } = require('./hlm-phase10-league-participation-references');

const make = leagues => createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }, { id: 3, name: 'Hawks' }],
  leagues
});
const valid = make([{ id: 7, name: 'Test League', teamIds: [1, 2] }]);
const original = JSON.stringify(valid);
const result = assess(valid, 7, 1, 2);
assert.equal(result.kind, 'phase10-league-participation-reference-assessment');
assert.equal(result.referencesConsistent, true);
assert.deepEqual(result.listedTeamIds, [1, 2]);
assert.deepEqual(result.teams.map(team => team.membership), ['listed', 'listed']);
assert.deepEqual(result.blockers, []);
assert.equal(result.leagueEligibilityCertified, false);
assert.equal(JSON.stringify(valid), original);
assert.deepEqual(assess(valid, 7, 1, 2), result);
assert.deepEqual(assess(valid, 7, 1, 3).blockers, ['TEAM_NOT_LISTED_IN_LEAGUE']);
assert.deepEqual(assess(valid, 7, 1, 99).blockers, ['UNKNOWN_PARTICIPATING_TEAM']);
assert.deepEqual(assess(make([]), 7, 1, 2).blockers, ['LEAGUE_RECORD_NOT_UNIQUE']);
assert.deepEqual(assess(make([{ id: 7 }, { id: 7 }]), 7, 1, 2).blockers,
  ['LEAGUE_RECORD_NOT_UNIQUE']);
assert.deepEqual(assess(make([{ id: 7, teamIds: [1, 1] }]), 7, 1, 2).blockers,
  ['LEAGUE_MEMBERSHIP_UNVERIFIED']);
assert.deepEqual(assess(make([{ id: 7, teamIds: [1, 999] }]), 7, 1, 2).blockers,
  ['LEAGUE_MEMBERSHIP_UNVERIFIED']);
assert.deepEqual(assess(make([{ id: 7, teamIds: [1, 0] }]), 7, 1, 2).blockers,
  ['LEAGUE_MEMBERSHIP_UNVERIFIED']);
for (const flag of ['leagueEligibilityCertified', 'gameReady', 'lineupAuthorized',
  'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.listedTeamIds.push(99);
result.teams[0].membership = 'TAMPER';
result.blockers.push('TAMPER');
assert.equal(JSON.stringify(valid), original);
assert(!JSON.stringify(assess(valid, 7, 1, 2)).includes('TAMPER'));
for (const [league, home, away] of [[0, 1, 2], [7, 1, 1], [7, -1, 2], [7, 1, 0]]) {
  assert.throws(() => assess(valid, league, home, away),
    { code: 'INVALID_LEAGUE_PARTICIPATION_REFERENCES' });
}
console.log('Mission 734 league participation reference tests passed.');
