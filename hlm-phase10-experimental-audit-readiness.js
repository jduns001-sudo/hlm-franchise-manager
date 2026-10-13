'use strict';
const { createExperimentalExpectedGoalsModel } = require('./hlm-phase10-experimental-expected-goals');
const { createExperimentalGoalProbabilities } = require('./hlm-phase10-experimental-goal-probabilities');
const { auditExperimentalGoalDistributions } = require('./hlm-phase10-experimental-goal-distribution-audit');
function createExperimentalAuditReadiness(state, homeTeamId, awayTeamId) {
  const expected = createExperimentalExpectedGoalsModel(state, homeTeamId, awayTeamId);
  const probabilities = createExperimentalGoalProbabilities(state, homeTeamId, awayTeamId);
  const audit = auditExperimentalGoalDistributions(state, homeTeamId, awayTeamId);
  const blockers = [];
  if (!expected.evidenceComplete || !probabilities.evidenceComplete || !audit.evidenceComplete) blockers.push('INCOMPLETE_ROSTER_EVIDENCE');
  for (const side of ['home','away']) {
    const item = audit[side];
    if (!item || !Number.isFinite(item.includedMass) || !Number.isFinite(item.omittedTailMass) ||
        item.includedMass < 0 || item.omittedTailMass < 0 ||
        Math.abs(item.includedMass + item.omittedTailMass - 1) > 1e-10) blockers.push(side.toUpperCase() + '_INVALID_PROBABILITY_MASS');
  }
  return {
    kind: 'phase10-experimental-audit-readiness',
    version: 1,
    homeTeamId: expected.homeTeamId,
    awayTeamId: expected.awayTeamId,
    ready: blockers.length === 0,
    blockers,
    homeAudit: audit.home ? { ...audit.home } : null,
    awayAudit: audit.away ? { ...audit.away } : null,
    homeRosterBlockers: expected.homeBlockers.map(item => ({ ...item })),
    awayRosterBlockers: expected.awayBlockers.map(item => ({ ...item })),
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalAuditReadiness };
