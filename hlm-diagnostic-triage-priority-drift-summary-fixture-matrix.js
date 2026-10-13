'use strict';

/**
 * Mission 691: fictional, detached scenarios exercising Missions 687 -> 688 -> 689.
 * These inputs are derived from synthetic fixture matrices, never live franchise state.
 */
const { createDiagnosticTriagePriorityFixtureMatrix } = require('./hlm-diagnostic-triage-priority-fixture-matrix');
const { createDiagnosticTriagePriorityDriftReport } = require('./hlm-diagnostic-triage-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSeverityReport } = require('./hlm-diagnostic-triage-priority-drift-severity');
const { createDiagnosticTriagePriorityDriftSummary } = require('./hlm-diagnostic-triage-priority-drift-summary');

const PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES = Object.freeze([
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);

function createPriorityDriftSummaryScenarioInput(name) {
  if (!PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES.includes(name)) {
    const error = new RangeError('Unknown priority drift summary scenario: ' + name);
    error.code = 'UNKNOWN_PRIORITY_DRIFT_SUMMARY_SCENARIO';
    throw error;
  }
  const matrix = createDiagnosticTriagePriorityFixtureMatrix();
  const regression = matrix.rows.find(row => row.scenario === 'diagnosticRegression');
  const ordering = matrix.rows.find(row => row.scenario === 'orderingChange');
  switch (name) {
    case 'safetyViolation':
      matrix.simulationAuthorized = true;
      break;
    case 'diagnosticRegression':
      regression.highestSeverity = 'critical';
      regression.severityCounts.high += 1;
      regression.priorityFields.push('unexpected-priority');
      break;
    case 'orderingChange':
      ordering.categoryNames.reverse();
      matrix.rows.reverse();
      break;
    case 'mixedPriority':
      matrix.simulationAuthorized = true;
      regression.highestSeverity = 'critical';
      regression.severityCounts.high += 1;
      regression.priorityFields.push('unexpected-priority');
      ordering.categoryNames.reverse();
      matrix.rows.reverse();
      matrix.version += 1;
      break;
  }
  return matrix;
}

function createDiagnosticTriagePriorityDriftSummaryFixtureMatrix() {
  const rows = PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES.map(scenario => {
    const input = createPriorityDriftSummaryScenarioInput(scenario);
    const drift = createDiagnosticTriagePriorityDriftReport(input);
    const severity = createDiagnosticTriagePriorityDriftSeverityReport(drift);
    const summary = createDiagnosticTriagePriorityDriftSummary(severity);
    return {
      scenario,
      hasDrift: summary.hasDrift,
      findingCount: summary.findingCount,
      highestSeverity: summary.highestSeverity,
      severityCounts: { ...summary.counts },
      categoryCount: summary.categoryCount,
      categoryNames: summary.groups.map(group => group.category),
      priorityFields: summary.priorityFindings.map(finding => finding.field),
      simulationAuthorized: false
    };
  });
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-fixture-matrix',
    version: 1,
    scenarioCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = {
  PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES,
  createPriorityDriftSummaryScenarioInput,
  createDiagnosticTriagePriorityDriftSummaryFixtureMatrix
};
