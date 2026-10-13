'use strict';
const assert = require('node:assert/strict');
const { calculateOfficialGameRules: calculate } = require('./hlm-phase10-official-game-rules-calculator');

const home = { homeTeamId: 1, awayTeamId: 2, homeRegulationGoals: 4, awayRegulationGoals: 2 };
const away = { ...home, homeRegulationGoals: 1, awayRegulationGoals: 3 };
const tied = { ...home, homeRegulationGoals: 2, awayRegulationGoals: 2 };
const before = JSON.stringify(home);
const homeWin = calculate(home);
assert.deepEqual([homeWin.homeGoals, homeWin.awayGoals, homeWin.homePoints, homeWin.awayPoints], [4, 2, 2, 0]);
assert.equal(homeWin.winnerTeamId, 1);
assert.equal(homeWin.overtime, false);
const awayWin = calculate(away);
assert.deepEqual([awayWin.homePoints, awayWin.awayPoints, awayWin.winnerTeamId], [0, 2, 2]);
const otHome = calculate({ ...tied, overtimeWinnerTeamId: 1 });
assert.deepEqual([otHome.homeGoals, otHome.awayGoals, otHome.homePoints, otHome.awayPoints], [3, 2, 2, 1]);
assert.equal(otHome.overtime, true);
const otAway = calculate({ ...tied, overtimeWinnerTeamId: 2 });
assert.deepEqual([otAway.homeGoals, otAway.awayGoals, otAway.homePoints, otAway.awayPoints], [2, 3, 1, 2]);
assert.equal(otAway.winnerTeamId, 2);
assert.deepEqual(calculate(home), homeWin);
assert.equal(JSON.stringify(home), before);
for (const result of [homeWin, awayWin, otHome, otAway]) {
  for (const flag of ['resultOfficial', 'authorizationIssued', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
    assert.equal(result[flag], false);
  }
}
for (const invalid of [null, [], {}, { ...home, homeTeamId: 2 },
  { ...home, homeRegulationGoals: -1 }, { ...home, awayRegulationGoals: 2.5 },
  { ...home, homeTeamId: '1' }]) {
  assert.throws(() => calculate(invalid), { code: 'INVALID_OFFICIAL_GAME_RULE_INPUT' });
}
for (const invalid of [tied, { ...tied, overtimeWinnerTeamId: 3 },
  { ...home, overtimeWinnerTeamId: 1 }]) {
  assert.throws(() => calculate(invalid), { code: 'INVALID_OFFICIAL_OVERTIME_WINNER' });
}
console.log('Mission 730 official rules calculator tests passed.');
