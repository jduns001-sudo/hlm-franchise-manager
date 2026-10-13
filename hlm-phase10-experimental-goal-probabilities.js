'use strict';

/**
 * Mission 741: read-only experimental expected-goals outcome probabilities.
 * Independent Poisson assumptions for research only; never produces a result.
 */
const { createExperimentalExpectedGoalsModel } = require('./hlm-phase10-experimental-expected-goals');

function poissonDistribution(lambda, maxGoals) {
  const values = [Math.exp(-lambda)];
  for (let i = 1; i <= maxGoals; i++) values.push(values[i - 1] * lambda / i);
  return values;
}

function createExperimentalGoalProbabilityPreview(state, homeTeamId, awayTeamId) {
  const expected = createExperimentalExpectedGoalsModel(state, homeTeamId, awayTeamId);
  const ready = expected.evidenceComplete &&
    Number.isFinite(expected.homeExpectedGoals) && Number.isFinite(expected.awayExpectedGoals);
  let homeWinProbability = null;
  let tieProbability = null;
  let awayWinProbability = null;
  if (ready) {
    // Numerical tail bound: expected goals are <= 3.75 under Mission 740's clamp.
    const maxGoals = 40;
    const home = poissonDistribution(expected.homeExpectedGoals, maxGoals);
    const away = poissonDistribution(expected.awayExpectedGoals, maxGoals);
    let h = 0, t = 0, a = 0;
    for (let i = 0; i <= maxGoals; i++) {
      for (let j = 0; j <= maxGoals; j++) {
        const p = home[i] * away[j];
        if (i > j) h += p;
        else if (i === j) t += p;
        else a += p;
      }
    }
    // Normalize negligible truncated tails; probabilities sum to one.
    const total = h + t + a;
    homeWinProbability = h / total;
    tieProbability = t / total;
    awayWinProbability = a / total;
  }
  return {
    kind: 'phase10-experimental-goal-probability-preview',
    version: 1,
    homeTeamId: expected.homeTeamId,
    awayTeamId: expected.awayTeamId,
    evidenceComplete: !!ready,
    homeExpectedGoals: expected.homeExpectedGoals,
    awayExpectedGoals: expected.awayExpectedGoals,
    homeWinProbability,
    tieProbability,
    awayWinProbability,
    homeBlockers: expected.homeBlockers.map(item => ({ ...item })),
    awayBlockers: expected.awayBlockers.map(item => ({ ...item })),
    homeMissingSlots: expected.homeMissingSlots.slice(),
    awayMissingSlots: expected.awayMissingSlots.slice(),
    // Probabilities are experimental regulation-time research metrics.
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createExperimentalGoalProbabilityPreview };
