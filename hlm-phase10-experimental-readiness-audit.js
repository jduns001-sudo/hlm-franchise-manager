'use strict';
const { createExperimentalDiagnosticsSummary } = require('./hlm-phase10-experimental-diagnostics-summary');
function createExperimentalReadinessAudit(state, homeTeamId, awayTeamId) {
  const summary = createExperimentalDiagnosticsSummary(state, homeTeamId, awayTeamId);
  const blockers = summary.blockers.slice();
  return {
    kind: 'phase10-experimental-readiness-audit',
    version: 1,
    homeTeamId: summary.homeTeamId,
    awayTeamId: summary.awayTeamId,
    researchReady: summary.researchReady,
    evidenceComplete: summary.evidenceComplete,
    reportValid: summary.reportValid,
    auditStatus: summary.researchReady ? 'RESEARCH_EVIDENCE_READY' : 'RESEARCH_EVIDENCE_BLOCKED',
    blockerCount: blockers.length,
    blockers,
    simulationAuthorized: false,
    eligibilityCertified: false,
    scoreCalculated: false,
    gameResultCreated: false,
    standingsUpdated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalReadinessAudit };
