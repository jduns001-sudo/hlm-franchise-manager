'use strict';
const { validateExperimentalResearchReport } = require('./hlm-phase10-experimental-report-validation');
function createExperimentalValidationGates(state, homeTeamId, awayTeamId) {
  const validation = validateExperimentalResearchReport(state, homeTeamId, awayTeamId);
  const evidenceComplete = validation.evidenceComplete === true;
  const reportValid = validation.reportValid === true;
  const blockers = [...validation.blockers, ...validation.findings];
  return {
    kind: 'phase10-experimental-validation-gates',
    version: 1,
    homeTeamId,
    awayTeamId,
    evidenceComplete,
    reportValid,
    researchGatePassed: evidenceComplete && reportValid,
    blockers: [...new Set(blockers)],
    simulationAuthorized: false,
    eligibilityCertified: false,
    scoreCalculated: false,
    gameResultCreated: false,
    standingsUpdated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalValidationGates };
