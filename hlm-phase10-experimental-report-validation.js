'use strict';
const { createExperimentalResearchReport } = require('./hlm-phase10-experimental-research-report');
function validateExperimentalResearchReport(state, homeTeamId, awayTeamId) {
  const report = createExperimentalResearchReport(state, homeTeamId, awayTeamId);
  const findings = [];
  const ready = report.researchEvidenceReady === true;
  if (!ready) findings.push('INCOMPLETE_RESEARCH_EVIDENCE');
  if (!Array.isArray(report.blockers)) findings.push('INVALID_BLOCKERS');
  if (ready) {
    if (!report.expectedGoals || !report.probabilityTail7Plus) findings.push('MISSING_RESEARCH_ESTIMATES');
    for (const side of ['home', 'away']) {
      const goals = report.expectedGoals && report.expectedGoals[side];
      const tail = report.probabilityTail7Plus && report.probabilityTail7Plus[side];
      if (!Number.isFinite(goals) || goals < 0) findings.push(side.toUpperCase() + '_INVALID_EXPECTED_GOALS');
      if (!Number.isFinite(tail) || tail < 0 || tail > 1) findings.push(side.toUpperCase() + '_INVALID_TAIL_PROBABILITY');
    }
  } else if (report.expectedGoals !== null || report.probabilityTail7Plus !== null) {
    findings.push('ESTIMATES_PRESENT_WITHOUT_EVIDENCE');
  }
  return {
    kind: 'phase10-experimental-report-validation',
    version: 1,
    reportValid: findings.length === 0 && ready,
    evidenceComplete: ready,
    findings,
    blockers: Array.isArray(report.blockers) ? report.blockers.slice() : ['INVALID_BLOCKERS'],
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { validateExperimentalResearchReport };
