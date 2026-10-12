'use strict';

/**
 * Mission 681: descriptive, read-only drift against independently pinned
 * Mission 680 triage expectations. Never authorizes simulation.
 */
const { TRIAGE_EXPECTED_BASELINE_V1 } = require('./hlm-diagnostic-triage-baseline-v1');
const { createDiagnosticTriageFixtureMatrix } = require('./hlm-diagnostic-triage-fixture-matrix');

function createDiagnosticTriageDriftReport(matrix = createDiagnosticTriageFixtureMatrix()) {
  if (!matrix || typeof matrix !== 'object' || !Array.isArray(matrix.rows)) {
    const error = new TypeError('A diagnostic triage fixture matrix with rows is required');
    error.code = 'INVALID_TRIAGE_FIXTURE_MATRIX';
    throw error;
  }
  const baseline = TRIAGE_EXPECTED_BASELINE_V1;
  const findings = [];
  function record(scenario, field, expected, actual, code = 'TRIAGE_BASELINE_CHANGED') {
    findings.push({
      scenario, field,
      expected: Array.isArray(expected) ? [...expected] : expected,
      actual: Array.isArray(actual) ? [...actual] : actual,
      code
    });
  }
  for (const [field, expected] of Object.entries({
    kind: 'franchise-diagnostic-triage-fixture-matrix',
    version: baseline.matrixVersion,
    scenarioCount: baseline.scenarioNames.length,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  })) {
    if (matrix[field] !== expected) {
      record(null, field, expected, matrix[field],
        ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed'].includes(field)
          ? 'TRIAGE_SAFETY_INVARIANT_CHANGED' : 'TRIAGE_MATRIX_METADATA_CHANGED');
    }
  }
  const names = matrix.rows.map(row => row && row.scenario);
  if (JSON.stringify(names) !== JSON.stringify(baseline.scenarioNames)) {
    record(null, 'scenarioNames', baseline.scenarioNames, names, 'TRIAGE_SCENARIO_ORDER_CHANGED');
  }
  for (const name of baseline.scenarioNames) {
    const matches = matrix.rows.filter(row => row && row.scenario === name);
    if (matches.length !== 1) {
      record(name, 'scenario', 1, matches.length, 'TRIAGE_SCENARIO_MISSING_OR_DUPLICATED');
      continue;
    }
    const row = matches[0];
    const expected = baseline.expectations[name];
    for (const field of ['hasDrift', 'driftCount', 'highestSeverity', 'categoryCount']) {
      const target = field === 'categoryCount' ? expected.categoryNames.length : expected[field];
      if (row[field] !== target) record(name, field, target, row[field]);
    }
    for (const severity of ['critical', 'high', 'medium', 'low']) {
      const actual = row.severityCounts && row.severityCounts[severity];
      if (actual !== expected.severityCounts[severity]) {
        record(name, 'severityCounts.' + severity, expected.severityCounts[severity], actual,
          'TRIAGE_SEVERITY_COUNT_CHANGED');
      }
    }
    for (const field of ['categoryNames', 'priorityFields']) {
      const actual = row[field];
      if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected[field])) {
        record(name, field, expected[field], actual,
          field === 'categoryNames' ? 'TRIAGE_CATEGORY_ORDER_CHANGED' : 'TRIAGE_PRIORITY_ORDER_CHANGED');
      }
    }
    if (row.simulationAuthorized !== false) {
      record(name, 'simulationAuthorized', false, row.simulationAuthorized, 'TRIAGE_SAFETY_INVARIANT_CHANGED');
    }
  }
  return {
    kind: 'franchise-diagnostic-triage-drift-report',
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

module.exports = { createDiagnosticTriageDriftReport };
