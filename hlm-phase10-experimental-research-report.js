'use strict';
const { createExperimentalReadinessSummary } = require('./hlm-phase10-experimental-readiness-summary');
function createExperimentalResearchReport(state, homeTeamId, awayTeamId) {
  const summary = createExperimentalReadinessSummary(state, homeTeamId, awayTeamId);
  const ready = summary.researchEvidenceReady === true;
  return {
    kind: 'phase10-experimental-research-report',
    version: 1,
    homeTeamId: summary.homeTeamId,
    awayTeamId: summary.awayTeamId,
    researchEvidenceReady: ready,
    blockers: summary.blockers.slice(),
    expectedGoals: ready ? {
      home: summary.homeExpectedGoals,
      away: summary.awayExpectedGoals
    } : null,
    probabilityTail7Plus: ready ? {
      home: summary.homeProbabilityTail7Plus,
      away: summary.awayProbabilityTail7Plus
    } : null,
    interpretation: ready
      ? 'Fictional research assumptions only; no game prediction or outcome is authorized.'
      : 'Incomplete evidence; research estimates withheld.',
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalResearchReport };
