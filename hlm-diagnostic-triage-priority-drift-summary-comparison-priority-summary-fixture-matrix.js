'use strict';

/** Mission 703: fictional, read-only priority summary regression scenarios. */
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySeverityReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummary } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary');

const PRIORITY_SUMMARY_SCENARIO_NAMES = Object.freeze([
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);

function createPrioritySummaryScenarioInput(name) {
  if (!PRIORITY_SUMMARY_SCENARIO_NAMES.includes(name)) {
    const error = new RangeError('Unknown priority summary scenario: ' + name);
    error.code = 'UNKNOWN_PRIORITY_SUMMARY_SCENARIO';
    throw error;
  }
  const matrix = createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix();
  const mixed = matrix.rows.find(row => row.scenario === 'mixedPriority');
  switch (name) {
    case 'safetyViolation':
      matrix.simulationAuthorized = true;
      break;
    case 'diagnosticRegression':
      mixed.highestSeverity = 'medium';
      mixed.severityCounts.high += 1;
      mixed.priorityFields.push('unexpected-priority');
      mixed.urgentFields.push('unexpected-urgent');
      break;
    case 'orderingChange':
      mixed.categoryNames.reverse();
      matrix.rows.reverse();
      break;
    case 'mixedPriority':
      matrix.simulationAuthorized = true;
      mixed.highestSeverity = 'medium';
      mixed.severityCounts.high += 1;
      mixed.priorityFields.push('unexpected-priority');
      mixed.urgentFields.push('unexpected-urgent');
      mixed.categoryNames.reverse();
      matrix.rows.reverse();
      matrix.version += 1;
      break;
  }
  return matrix;
}

function createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix() {
  const rows = PRIORITY_SUMMARY_SCENARIO_NAMES.map(scenario => {
    const input = createPrioritySummaryScenarioInput(scenario);
    const comparison = createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport(input);
    const severity = createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySeverityReport(comparison);
    const summary = createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummary(severity);
    return {
      scenario,
      hasDrift: summary.hasDrift,
      findingCount: summary.findingCount,
      highestSeverity: summary.highestSeverity,
      severityCounts: { ...summary.counts },
      categoryCount: summary.categoryCount,
      categoryNames: summary.groups.map(group => group.category),
      priorityFields: summary.priorityFindings.map(finding => finding.field),
      urgentFields: summary.urgentFindings.map(finding => finding.field),
      simulationAuthorized: false
    };
  });
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix',
    version: 1,
    scenarioCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = {
  PRIORITY_SUMMARY_SCENARIO_NAMES,
  createPrioritySummaryScenarioInput,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix
};
