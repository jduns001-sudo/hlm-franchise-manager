'use strict';

/**
 * Mission 742: research-only outcome preview from Mission 741 goal probabilities.
 * 0..6 goal outcomes are conditioned on both teams falling inside that range.
 * This does not sample scores, resolve games or modify a franchise.
 */
const { createExperimentalGoalProbabilities } = require('./hlm-phase10-experimental-goal-probabilities');

function createExperimentalRegulationOutcomePreview(state, homeTeamId, awayTeamId) {
  const goals = createExperimentalGoalProbabilities(state, homeTeamId, awayTeamId);
  const home = goals.homeGoalProbabilities0to6;
  const away = goals.awayGoalProbabilities0to6;
  const ready = goals.evidenceComplete === true && Array.isArray(home) && Array.isArray(away) &&
    home.length === 7 && away.length === 7 &&
    [...home, ...away].every(p => Number.isFinite(p) && p >= 0);
  let homeWinProbability = null, tieProbability = null, awayWinProbability = null;
  let includedMass = null;
  if (ready) {
    let h = 0, t = 0, a = 0;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const mass = home[i] * away[j];
        if (i > j) h += mass;
        else if (i === j) t += mass;
        else a += mass;
      }
    }
    includedMass = h + t + a;
    if (includedMass > 0) {
      homeWinProbability = h / includedMass;
      tieProbability = t / includedMass;
      awayWinProbability = a / includedMass;
    }
  }
  return {
    kind: 'phase10-experimental-regulation-outcome-preview',
    version: 1,
    homeTeamId: goals.homeTeamId,
    awayTeamId: goals.awayTeamId,
    evidenceComplete: ready && includedMass > 0,
    conditioning: 'both-teams-goals-0-to-6',
    includedMass,
    homeWinProbability,
    tieProbability,
    awayWinProbability,
    homeBlockers: goals.homeBlockers.map(b => ({ ...b })),
    awayBlockers: goals.awayBlockers.map(b => ({ ...b })),
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createExperimentalRegulationOutcomePreview };
