'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { REQUIRED_RULES, assessOfficialGameAuthorization: assess } =
  require('./hlm-phase10-official-game-authorization');

const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, index) => {
    players.push({ id: base + index, teamId, position, ovr: 75 + index });
  });
}
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }],
  players,
  games: [{ id: 'G1', date: '2026-10-14', status: 'scheduled', homeTeamId: 1, awayTeamId: 2 }]
});
const original = JSON.stringify(state);
assert.deepEqual(REQUIRED_RULES, [
  'lineupEligibility', 'regulationScoring', 'overtimeResolution',
  'standingsPoints', 'resultPersistence'
]);
const defaultReport = assess(state, {}, 17);
assert.equal(defaultReport.kind, 'phase10-official-game-authorization-assessment');
assert.equal(defaultReport.scheduledGameCount, 1);
assert.equal(defaultReport.blockedGameCount, 1);
assert.deepEqual(defaultReport.missingRuleCapabilities, REQUIRED_RULES);
assert(defaultReport.games[0].blockers.includes('OFFICIAL_GAME_RULES_NOT_AUTHORIZED'));
assert(defaultReport.games[0].blockers.includes('OFFICIAL_RESULT_APPLICATION_NOT_IMPLEMENTED'));
assert.equal(defaultReport.games[0].canApplyOfficialResult, false);
assert.equal(defaultReport.authorizationIssued, false);
assert.equal(defaultReport.officialResultCount, 0);
const declared = Object.fromEntries(REQUIRED_RULES.map(key => [key, true]));
const allDeclared = assess(state, declared, 17);
assert.deepEqual(allDeclared.missingRuleCapabilities, []);
assert.deepEqual(allDeclared.declaredRuleCapabilities, REQUIRED_RULES);
assert(allDeclared.games[0].blockers.includes('OFFICIAL_GAME_RULES_NOT_AUTHORIZED'));
assert(allDeclared.games[0].blockers.includes('OFFICIAL_RESULT_APPLICATION_NOT_IMPLEMENTED'));
assert.equal(allDeclared.games[0].canApplyOfficialResult, false);
assert.equal(allDeclared.authorizationIssued, false);
assert.deepEqual(assess(state, declared, 17), allDeclared);
assert.equal(JSON.stringify(state), original);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(allDeclared[flag], false);
}
allDeclared.games[0].blockers.push('TAMPER');
allDeclared.missingRuleCapabilities.push('TAMPER');
assert.equal(JSON.stringify(state), original);
assert(!JSON.stringify(assess(state, declared, 17)).includes('TAMPER'));
for (const invalid of [null, [], 1, 'yes']) {
  assert.throws(() => assess(state, invalid), { code: 'INVALID_OFFICIAL_GAME_RULES' });
}
const broken = createGameStateEnvelope();
broken.schemaVersion = 99;
assert.throws(() => assess(broken), { code: 'INVALID_SEASON_ROSTER_PREVIEW_STATE' });
console.log('Mission 729 official game authorization contract tests passed.');
