'use strict';

/**
 * Mission 673: read-only regression matrix over all fictional Mission 672
 * fixtures. Rows are detached diagnostics, never gameplay decisions.
 */
const { DIAGNOSTIC_FIXTURE_NAMES, createDiagnosticFixture } = require('./hlm-franchise-diagnostic-fixtures');
const { createFranchiseDataHealthReport } = require('./hlm-franchise-data-health-report');

function createFranchiseDiagnosticRegressionMatrix() {
  const rows = DIAGNOSTIC_FIXTURE_NAMES.map(name => {
    const { universe, roster } = createDiagnosticFixture(name);
    const report = createFranchiseDataHealthReport(universe, roster);
    return {
      fixture: name,
      dataQualityValid: report.dataQuality.valid,
      reportedIssueCount: report.dataQuality.reportedIssueCount,
      errorCodes: report.dataQuality.errors.map(issue => issue.code),
      organizationWarningCodes: report.warnings.organization.map(issue => issue.code),
      readinessWarningCodes: report.warnings.readiness.map(issue => issue.code),
      warningCount: report.warnings.count,
      teamCount: report.roster.summary.teamCount,
      candidateCount: report.roster.summary.candidateCount,
      unresolvedPlayerCount: report.roster.summary.unresolvedPlayerCount,
      unresolvedByStatus: { ...report.roster.unresolvedByStatus },
      simulationAuthorized: false
    };
  });
  return {
    kind: 'franchise-diagnostic-regression-matrix',
    version: 1,
    fixtureCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createFranchiseDiagnosticRegressionMatrix };
