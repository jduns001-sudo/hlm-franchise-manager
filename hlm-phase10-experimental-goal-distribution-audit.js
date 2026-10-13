'use strict';
// Research-only audit. Does not select scores, outcomes, or alter saves.
const { createExperimentalGoalProbabilities } = require('./hlm-phase10-experimental-goal-probabilities');
function auditExperimentalGoalDistributions(state, homeTeamId, awayTeamId) {
  const model = createExperimentalGoalProbabilities(state, homeTeamId, awayTeamId);
  const ready = model.evidenceComplete === true;
  const audit = values => {
    if (!ready || !Array.isArray(values) || values.length !== 7) return null;
    const includedMass = values.reduce((sum, p) => sum + p, 0);
    if (!values.every(p => Number.isFinite(p) && p >= 0 && p <= 1) || includedMass > 1 + 1e-12) return null;
    return { includedMass, omittedTailMass: Math.max(0, 1 - includedMass) };
  };
  return {
    kind: 'phase10-experimental-goal-distribution-audit',
    version: 1,
    evidenceComplete: ready,
    home: audit(model.homeGoalProbabilities0to6),
    away: audit(model.awayGoalProbabilities0to6),
    homeBlockers: model.homeBlockers,
    awayBlockers: model.awayBlockers,
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { auditExperimentalGoalDistributions };
