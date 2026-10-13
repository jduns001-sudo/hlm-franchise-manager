'use strict';
const { createExperimentalAuditReadiness } = require('./hlm-phase10-experimental-audit-readiness');
const { createExperimentalExpectedGoalsModel } = require('./hlm-phase10-experimental-expected-goals');
function createExperimentalReadinessSummary(state, homeTeamId, awayTeamId) {
  const readiness = createExperimentalAuditReadiness(state, homeTeamId, awayTeamId);
  const expected = createExperimentalExpectedGoalsModel(state, homeTeamId, awayTeamId);
  const safe = readiness.ready === true && expected.evidenceComplete === true;
  return {
    kind: 'phase10-experimental-readiness-summary',
    version: 1,
    homeTeamId: readiness.homeTeamId,
    awayTeamId: readiness.awayTeamId,
    researchEvidenceReady: safe,
    blockers: readiness.blockers.slice(),
    homeExpectedGoals: safe ? expected.homeExpectedGoals : null,
    awayExpectedGoals: safe ? expected.awayExpectedGoals : null,
    homeProbabilityTail7Plus: safe ? readiness.homeAudit.omittedTailMass : null,
    awayProbabilityTail7Plus: safe ? readiness.awayAudit.omittedTailMass : null,
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalReadinessSummary };
