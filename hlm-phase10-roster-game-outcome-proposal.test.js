'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createRosterBackedGameOutcomeProposal: propose } = require('./hlm-phase10-roster-game-outcome-proposal');
const players = [];
for (const [teamId, base] of [[1, 100], [2, 200]]) {
  ['C', 'LW', 'RW', 'D', 'D', 'G'].forEach((position, i) =>
    players.push({ id: base + i, teamId, position, ovr: 80 }));
}
const state = createGameStateEnvelope({
  teams: [{ id: 1, name: 'Wolves' }, { id: 2, name: 'Bears' }], players
});
const before = JSON.stringify(state);
for (let seed = 0; seed < 60; seed++) {
  const report = propose(state, 1, 2, seed);
  assert.equal(report.kind, 'phase10-roster-game-outcome-proposal');
  assert.equal(report.previewAvailable, true);
  assert.deepEqual(report.homeMissingSlots, []);
  assert.deepEqual(report.awayMissingSlots, []);
  assert.equal(report.gameReady, null);
  assert([1, 2].includes(report.outcome.winnerTeamId));
  assert([1, 2].includes(report.outcome.loserTeamId));
  assert.notEqual(report.outcome.winnerTeamId, report.outcome.loserTeamId);
  assert.equal(report.outcome.resultOfficial, false);
  assert.equal(report.outcome.tiedAtRegulation,
    report.outcome.regulationScore.homeGoals === report.outcome.regulationScore.awayGoals);
  if (report.outcome.tiedAtRegulation) {
    assert.equal(report.outcome.resolution, 'ILLUSTRATIVE_TIE_BREAK');
    assert.equal(report.outcome.winnerTeamId, (seed + 3) % 2 === 0 ? 1 : 2);
  } else {
    assert.equal(report.outcome.resolution, 'REGULATION_PREVIEW');
    assert.equal(report.outcome.winnerTeamId,
      report.outcome.regulationScore.homeGoals > report.outcome.regulationScore.awayGoals ? 1 : 2);
  }
  assert.deepEqual(propose(state, 1, 2, seed), report);
  for (const flag of ['resultOfficial', 'lineupAuthorized', 'simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
    assert.equal(report[flag], false);
  }
}
const incomplete = createGameStateEnvelope({
  teams: state.universe.teams, players: players.filter(p => p.id !== 205)
});
const pending = propose(incomplete, 1, 2, 42);
assert.equal(pending.previewAvailable, false);
assert.equal(pending.outcome, null);
assert.deepEqual(pending.awayMissingSlots, ['G']);
const unknown = propose(state, 1, 3, 42);
assert.equal(unknown.outcome, null);
assert.deepEqual(unknown.awayMissingSlots, ['TEAM_NOT_FOUND']);
assert.equal(JSON.stringify(state), before);
const first = propose(state, 1, 2, 42);
first.outcome.regulationScore.homeGoals = 999;
first.homeMissingSlots.push('TAMPER');
assert.notEqual(propose(state, 1, 2, 42).outcome.regulationScore.homeGoals, 999);
for (const [a, b] of [[0, 2], [1, 1], [-1, 2]]) {
  assert.throws(() => propose(state, a, b), { code: 'INVALID_ROSTER_GAME_READINESS_TEAMS' });
}
for (const seed of [-1, NaN, 1.5]) {
  assert.throws(() => propose(state, 1, 2, seed), { code: 'INVALID_ROSTER_GAME_READINESS_SEED' });
}
console.log('Mission 725 roster game outcome proposal tests passed.');
