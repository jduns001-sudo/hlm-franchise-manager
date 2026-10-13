'use strict';

/**
 * Mission 697: fictional, read-only scenarios for Mission 695 priority reports.
 * No real franchise state or browser persistence is accessed.
 */
const { createDiagnosticTriagePriorityDriftSummaryFixtureMatrix } =
  require('./hlm-diagnostic-triage-priority-drift-summary-fixture-matrix');
const { createDiagnosticTriagePriorityDriftSummaryComparisonReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonSeverityReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority');

const SUMMARY_COMPARISON_PRIORITY_SCENARIO_NAMES = Object.freeze([
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);

function createSummaryComparisonPriorityScenarioInput(name) {
  if (!SUMMARY_COMPARISON_PRIORITY_SCENARIO_NAMES.includes(name)) {
    const error = new RangeError('Unknown summary comparison priority scenario: ' + name);
    error.code = 'UNKNOWN_SUMMARY_COMPARISON_PRIORITY_SCENARIO';
    throw error;
  }
  const matrix = createDiagnosticTriagePriorityDriftSummaryFixtureMatrix();
  const mixed = matrix.rows.find(row => row.scenario === 'mixedPriority');
  switch (name) {
    case 'safetyViolation':
      matrix.simulationAuthorized = true;
      break;
    case 'diagnosticRegression':
      mixed.highestSeverity = 'high';
      mixed.severityCounts.high += 1;
      mixed.priorityFields.push('unexpected-priority');
      break;
    case 'orderingChange':
      mixed.categoryNames.reverse();
      matrix.rows.reverse();
      break;
    case 'mixedPriority':
      matrix.simulationAuthorized = true;
      mixed.highestSeverity = 'high';
      mixed.severityCounts.high += 1;
      mixed.priorityFields.push('unexpected-priority');
      mixed.categoryNames.reverse();
      matrix.rows.reverse();
      matrix.version += 1;
      break;
  }
  return matrix;
}

function createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix() {
  const rows = SUMMARY_COMPARISON_PRIORITY_SCENARIO_NAMES.map(scenario => {
    const input = createSummaryComparisonPriorityScenarioInput(scenario);
    const comparison = createDiagnosticTriagePriorityDriftSummaryComparisonReport(input);
    const severity = createDiagnosticTriagePriorityDriftSummaryComparisonSeverityReport(comparison);
    const priority = createDiagnosticTriagePriorityDriftSummaryComparisonPriorityReport(severity);
    return {
      scenario,
      hasDrift: priority.hasDrift,
      findingCount: priority.findingCount,
      highestSeverity: priority.highestSeverity,
      severityCounts: { ...priority.counts },
      categoryCount: priority.categoryCount,
      categoryNames: priority.groups.map(group => group.category),
      priorityFields: priority.priorityFindings.map(finding => finding.field),
      urgentFields: priority.urgentFindings.map(finding => finding.field),
      simulationAuthorized: false
    };
  });
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix',
    version: 1,
    scenarioCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = {
  SUMMARY_COMPARISON_PRIORITY_SCENARIO_NAMES,
  createSummaryComparisonPriorityScenarioInput,
  createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix
};
