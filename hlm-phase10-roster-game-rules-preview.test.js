'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterGameRulesPreview: preview } = require('./hlm-phase10-roster-game-rules-preview');
const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, i) =>
    players.push({ id: base + i, teamId, position, ovr: 80 }));
}
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }], players
});
const original = JSON.stringify(state);
let sawOvertime = false, sawRegulation = false;
for (let seed = 0; seed < 100; seed++) {
  const result = preview(state, 1, 2, seed);
  assert.equal(result.kind, 'phase10-roster-game-rules-preview');
  assert.equal(result.previewAvailable, true);
  assert.equal(result.gameReady, null);
  assert.deepEqual(result.homeMissingSlots, []);
  assert.deepEqual(result.awayMissingSlots, []);
  const score = result.regulationScore;
  const calculated = result.calculatedResult;
  assert(calculated);
  assert([1, 2].includes(calculated.winnerTeamId));
  assert.notEqual(calculated.winnerTeamId, calculated.loserTeamId);
  if (score.homeGoals === score.awayGoals) {
    sawOvertime = true;
    assert.equal(calculated.overtime, true);
    assert.equal(calculated.homeGoals + calculated.awayGoals, score.homeGoals + score.awayGoals + 1);
    assert.equal(calculated.homePoints + calculated.awayPoints, 3);
  } else {
    sawRegulation = true;
    assert.equal(calculated.overtime, false);
    assert.equal(calculated.homeGoals, score.homeGoals);
    assert.equal(calculated.awayGoals, score.awayGoals);
    assert.equal(calculated.homePoints + calculated.awayPoints, 2);
  }
  for (const flag of ['resultOfficial', 'authorizationIssued', 'lineupAuthorized',
    'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
    assert.equal(result[flag], false);
  }
  assert.deepEqual(preview(state, 1, 2, seed), result);
}
assert(sawOvertime && sawRegulation);
const incomplete = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 205)
});
const pending = preview(incomplete, 1, 2, 1);
assert.equal(pending.previewAvailable, false);
assert.equal(pending.calculatedResult, null);
assert.deepEqual(pending.awayMissingSlots, ['G']);
const unknown = preview(state, 1, 3, 1);
assert.equal(unknown.calculatedResult, null);
assert.deepEqual(unknown.awayMissingSlots, ['TEAM_NOT_FOUND']);
assert.equal(JSON.stringify(state), original);
const detached = preview(state, 1, 2, 7);
detached.homeMissingSlots.push('TAMPER');
detached.calculatedResult.homeGoals = 999;
assert(!JSON.stringify(preview(state, 1, 2, 7)).includes('TAMPER'));
assert.notEqual(preview(state, 1, 2, 7).calculatedResult.homeGoals, 999);
for (const [home, away] of [[0, 2], [1, 1], [-1, 2]]) {
  assert.throws(() => preview(state, home, away), { code: 'INVALID_ROSTER_GAME_READINESS_TEAMS' });
}
for (const seed of [-1, NaN, 1.5]) {
  assert.throws(() => preview(state, 1, 2, seed), { code: 'INVALID_ROSTER_GAME_READINESS_SEED' });
}
console.log('Mission 731 roster game rules preview integration tests passed.');
