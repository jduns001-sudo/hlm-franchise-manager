'use strict';
const { createExperimentalGateDiagnostics } = require('./hlm-phase10-experimental-gate-diagnostics');
function createExperimentalDiagnosticsSummary(state, homeTeamId, awayTeamId) {
  const diagnostics = createExperimentalGateDiagnostics(state, homeTeamId, awayTeamId);
  const blockers = diagnostics.blockers.slice();
  return {
    kind: 'phase10-experimental-diagnostics-summary',
    version: 1,
    homeTeamId: diagnostics.homeTeamId,
    awayTeamId: diagnostics.awayTeamId,
    researchStatus: diagnostics.diagnosticStatus,
    researchReady: diagnostics.researchReady,
    evidenceComplete: diagnostics.researchEvidenceComplete,
    reportValid: diagnostics.researchReportValid,
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
module.exports = { createExperimentalDiagnosticsSummary };
