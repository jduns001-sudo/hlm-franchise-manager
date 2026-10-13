'use strict';

/** Mission 705: read-only comparison of Mission 703 against pinned Mission 704. */
const { PRIORITY_SUMMARY_EXPECTED_BASELINE_V1 } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-baseline-v1');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix');

function createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryDriftReport(
  matrix = createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix()
) {
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix) || !Array.isArray(matrix.rows)) {
    const error = new TypeError('A Mission 703 priority summary fixture matrix with rows is required');
    error.code = 'INVALID_PRIORITY_SUMMARY_FIXTURE_MATRIX';
    throw error;
  }
  const baseline = PRIORITY_SUMMARY_EXPECTED_BASELINE_V1;
  const findings = [];
  const detach = value => Array.isArray(value) ? value.slice() : value;
  function record(scenario, field, expected, actual, code) {
    findings.push({ scenario, field, expected: detach(expected), actual: detach(actual), code });
  }
  const metadata = {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix',
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
          ? 'PRIORITY_SUMMARY_SAFETY_INVARIANT_CHANGED' : 'PRIORITY_SUMMARY_MATRIX_METADATA_CHANGED');
    }
  }
  const names = matrix.rows.map(row => row && row.scenario);
  if (JSON.stringify(names) !== JSON.stringify(baseline.scenarioNames)) {
    record(null, 'scenarioNames', baseline.scenarioNames, names,
      'PRIORITY_SUMMARY_SCENARIO_ORDER_CHANGED');
  }
  for (const name of baseline.scenarioNames) {
    const matches = matrix.rows.filter(row => row && row.scenario === name);
    if (matches.length !== 1) {
      record(name, 'scenario', 1, matches.length,
        'PRIORITY_SUMMARY_SCENARIO_MISSING_OR_DUPLICATED');
      continue;
    }
    const row = matches[0];
    const expected = baseline.expectations[name];
    for (const field of ['hasDrift', 'findingCount', 'highestSeverity', 'categoryCount']) {
      if (row[field] !== expected[field]) {
        record(name, field, expected[field], row[field], 'PRIORITY_SUMMARY_BASELINE_CHANGED');
      }
    }
    for (const level of ['critical', 'high', 'medium', 'low']) {
      const actual = row.severityCounts && row.severityCounts[level];
      if (actual !== expected.severityCounts[level]) {
        record(name, 'severityCounts.' + level, expected.severityCounts[level], actual,
          'PRIORITY_SUMMARY_SEVERITY_COUNT_CHANGED');
      }
    }
    for (const field of ['categoryNames', 'priorityFields', 'urgentFields']) {
      const actual = row[field];
      if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected[field])) {
        record(name, field, expected[field], actual,
          field === 'categoryNames' ? 'PRIORITY_SUMMARY_CATEGORY_ORDER_CHANGED' :
            field === 'priorityFields' ? 'PRIORITY_SUMMARY_PRIORITY_FIELDS_CHANGED' :
              'PRIORITY_SUMMARY_URGENT_FIELDS_CHANGED');
      }
    }
    if (row.simulationAuthorized !== false) {
      record(name, 'simulationAuthorized', false, row.simulationAuthorized,
        'PRIORITY_SUMMARY_SAFETY_INVARIANT_CHANGED');
    }
  }
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-drift-report',
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

module.exports = { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryDriftReport };
