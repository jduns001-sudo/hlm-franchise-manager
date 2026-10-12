'use strict';

/**
 * Mission 687: compare detached Mission 685 diagnostics to the independent
 * Mission 686 baseline. Descriptive only, never a simulation permission.
 */
const { PRIORITY_EXPECTED_BASELINE_V1 } = require('./hlm-diagnostic-triage-priority-baseline-v1');
const { createDiagnosticTriagePriorityFixtureMatrix } = require('./hlm-diagnostic-triage-priority-fixture-matrix');

function createDiagnosticTriagePriorityDriftReport(matrix = createDiagnosticTriagePriorityFixtureMatrix()) {
  if (!matrix || typeof matrix !== 'object' || !Array.isArray(matrix.rows)) {
    const error = new TypeError('A diagnostic triage priority fixture matrix with rows is required');
    error.code = 'INVALID_PRIORITY_FIXTURE_MATRIX';
    throw error;
  }
  const baseline = PRIORITY_EXPECTED_BASELINE_V1;
  const findings = [];
  const detach = value => Array.isArray(value) ? value.slice() : value;
  function record(scenario, field, expected, actual, code = 'PRIORITY_BASELINE_CHANGED') {
    findings.push({ scenario, field, expected: detach(expected), actual: detach(actual), code });
  }
  const metadata = {
    kind: 'franchise-diagnostic-triage-priority-fixture-matrix',
    version: baseline.matrixVersion,
    scenarioCount: baseline.scenarioNames.length,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
  for (const [field, expected] of Object.entries(metadata)) {
    if (matrix[field] !== expected) {
      record(null, field, expected, matrix[field],
        ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed'].includes(field)
          ? 'PRIORITY_SAFETY_INVARIANT_CHANGED' : 'PRIORITY_MATRIX_METADATA_CHANGED');
    }
  }
  const names = matrix.rows.map(row => row && row.scenario);
  if (JSON.stringify(names) !== JSON.stringify(baseline.scenarioNames)) {
    record(null, 'scenarioNames', baseline.scenarioNames, names, 'PRIORITY_SCENARIO_ORDER_CHANGED');
  }
  for (const name of baseline.scenarioNames) {
    const matches = matrix.rows.filter(row => row && row.scenario === name);
    if (matches.length !== 1) {
      record(name, 'scenario', 1, matches.length, 'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED');
      continue;
    }
    const row = matches[0];
    const expected = baseline.expectations[name];
    for (const field of ['hasDrift', 'findingCount', 'highestSeverity', 'categoryCount']) {
      if (row[field] !== expected[field]) record(name, field, expected[field], row[field]);
    }
    for (const level of ['critical', 'high', 'medium', 'low']) {
      const actual = row.severityCounts && row.severityCounts[level];
      if (actual !== expected.severityCounts[level]) {
        record(name, 'severityCounts.' + level, expected.severityCounts[level], actual,
          'PRIORITY_SEVERITY_COUNT_CHANGED');
      }
    }
    for (const field of ['categoryNames', 'priorityFields']) {
      const actual = row[field];
      if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected[field])) {
        record(name, field, expected[field], actual,
          field === 'categoryNames' ? 'PRIORITY_CATEGORY_ORDER_CHANGED' : 'PRIORITY_FIELD_ORDER_CHANGED');
      }
    }
    if (row.simulationAuthorized !== false) {
      record(name, 'simulationAuthorized', false, row.simulationAuthorized,
        'PRIORITY_SAFETY_INVARIANT_CHANGED');
    }
  }
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-report',
    version: 1,
    baselineVersion: baseline.version,
    matrixVersion: matrix.version,
    hasDrift: findings.length > 0,
    findingCount: findings.length,
    findings,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createDiagnosticTriagePriorityDriftReport };
