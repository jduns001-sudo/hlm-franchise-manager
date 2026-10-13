'use strict';
// Research-only Poisson goal probabilities; never a simulated game result.
const { createExperimentalExpectedGoalsModel } = require('./hlm-phase10-experimental-expected-goals');
function poisson(lambda, goals) {
  if (!Number.isFinite(lambda) || lambda < 0 || !Number.isInteger(goals) || goals < 0) return null;
  let p = Math.exp(-lambda);
  for (let k = 1; k <= goals; k++) p *= lambda / k;
  return p;
}
function createExperimentalGoalProbabilities(state, homeTeamId, awayTeamId) {
  const expected = createExperimentalExpectedGoalsModel(state, homeTeamId, awayTeamId);
  const ready = expected.evidenceComplete === true;
  const distribution = lambda => ready ? Array.from({length: 7}, (_, goals) => poisson(lambda, goals)) : null;
  return {
    kind: 'phase10-experimental-goal-probabilities',
    version: 1,
    homeTeamId: expected.homeTeamId,
    awayTeamId: expected.awayTeamId,
    evidenceComplete: ready,
    homeGoalProbabilities0to6: distribution(expected.homeExpectedGoals),
    awayGoalProbabilities0to6: distribution(expected.awayExpectedGoals),
    // Values beyond six goals are intentionally excluded, not renormalized.
    homeBlockers: expected.homeBlockers,
    awayBlockers: expected.awayBlockers,
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { poisson, createExperimentalGoalProbabilities };
