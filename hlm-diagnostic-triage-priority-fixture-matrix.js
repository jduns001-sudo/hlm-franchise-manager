'use strict';

/**
 * Mission 685: fictional, detached diagnostic priority scenarios.
 * Exercises Missions 681 -> 682 -> 683 without changing live data.
 */
const { createDiagnosticTriageFixtureMatrix } = require('./hlm-diagnostic-triage-fixture-matrix');
const { createDiagnosticTriageDriftReport } = require('./hlm-diagnostic-triage-drift-report');
const { createDiagnosticTriageDriftSeverityReport } = require('./hlm-diagnostic-triage-drift-severity');
const { createDiagnosticTriagePrioritySummary } = require('./hlm-diagnostic-triage-priority-summary');

const PRIORITY_SCENARIO_NAMES = Object.freeze([
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);

function createPriorityScenarioInput(name) {
  if (!PRIORITY_SCENARIO_NAMES.includes(name)) {
    const error = new RangeError('Unknown diagnostic priority scenario: ' + name);
    error.code = 'UNKNOWN_PRIORITY_SCENARIO';
    throw error;
  }
  const matrix = createDiagnosticTriageFixtureMatrix();
  const mixed = matrix.rows.find(row => row.scenario === 'mixedPriority');
  switch (name) {
    case 'safetyViolation':
      matrix.simulationAuthorized = true;
      break;
    case 'diagnosticRegression':
      mixed.highestSeverity = 'high';
      mixed.severityCounts.high += 1;
      break;
    case 'orderingChange':
      mixed.categoryNames.reverse();
      break;
    case 'mixedPriority':
      matrix.simulationAuthorized = true;
      mixed.highestSeverity = 'high';
      mixed.severityCounts.high += 1;
      mixed.categoryNames.reverse();
      matrix.version += 1;
      break;
  }
  return matrix;
}

function createDiagnosticTriagePriorityFixtureMatrix() {
  const rows = PRIORITY_SCENARIO_NAMES.map(scenario => {
    const input = createPriorityScenarioInput(scenario);
    const drift = createDiagnosticTriageDriftReport(input);
    const severity = createDiagnosticTriageDriftSeverityReport(drift);
    const summary = createDiagnosticTriagePrioritySummary(severity);
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
    kind: 'franchise-diagnostic-triage-priority-fixture-matrix',
    version: 1,
    scenarioCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = {
  PRIORITY_SCENARIO_NAMES,
  createPriorityScenarioInput,
  createDiagnosticTriagePriorityFixtureMatrix
};
