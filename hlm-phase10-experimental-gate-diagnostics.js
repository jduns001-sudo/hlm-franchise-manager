'use strict';
const { createExperimentalValidationGates } = require('./hlm-phase10-experimental-validation-gates');
function createExperimentalGateDiagnostics(state, homeTeamId, awayTeamId) {
  const gates = createExperimentalValidationGates(state, homeTeamId, awayTeamId);
  const blockers = gates.blockers.slice();
  const researchReady = gates.researchGatePassed === true;
  return {
    kind: 'phase10-experimental-gate-diagnostics',
    version: 1,
    homeTeamId: gates.homeTeamId,
    awayTeamId: gates.awayTeamId,
    researchEvidenceComplete: gates.evidenceComplete,
    researchReportValid: gates.reportValid,
    researchReady,
    diagnosticStatus: researchReady ? 'RESEARCH_READY' : 'RESEARCH_BLOCKED',
    blockers,
    blockerCount: blockers.length,
    simulationAuthorized: false,
    eligibilityCertified: false,
    scoreCalculated: false,
    gameResultCreated: false,
    standingsUpdated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalGateDiagnostics };
