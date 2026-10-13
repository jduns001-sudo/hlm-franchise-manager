'use strict';
const assert = require('node:assert/strict');
const { PRIORITY_DRIFT_SUMMARY_EXPECTED_BASELINE_V1: baseline } = require('./hlm-diagnostic-triage-priority-drift-summary-baseline-v1');
const { createDiagnosticTriagePriorityDriftSummaryFixtureMatrix } = require('./hlm-diagnostic-triage-priority-drift-summary-fixture-matrix');

assert.equal(baseline.kind, 'franchise-diagnostic-triage-priority-drift-summary-expected-baseline');
assert.equal(baseline.version, 1);
assert.equal(baseline.matrixVersion, 1);
assert.deepEqual(baseline.scenarioNames, [
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);
assert(Object.isFrozen(baseline));
assert(Object.isFrozen(baseline.scenarioNames));
assert(Object.isFrozen(baseline.expectations));
const matrix = createDiagnosticTriagePriorityDriftSummaryFixtureMatrix();
assert.equal(matrix.kind, 'franchise-diagnostic-triage-priority-drift-summary-fixture-matrix');
assert.equal(matrix.version, baseline.matrixVersion);
assert.equal(matrix.scenarioCount, 5);
assert.deepEqual(matrix.rows.map(row => row.scenario), baseline.scenarioNames);
assert.deepEqual(Object.keys(baseline.expectations), baseline.scenarioNames);
for (const row of matrix.rows) {
  const expected = baseline.expectations[row.scenario];
  assert(expected, 'missing independent expectation: ' + row.scenario);
  assert(Object.isFrozen(expected));
  assert(Object.isFrozen(expected.severityCounts));
  assert(Object.isFrozen(expected.categoryNames));
  assert(Object.isFrozen(expected.priorityFields));
  assert.deepEqual({
    hasDrift: row.hasDrift,
    findingCount: row.findingCount,
    highestSeverity: row.highestSeverity,
    severityCounts: row.severityCounts,
    categoryCount: row.categoryCount,
    categoryNames: row.categoryNames,
    priorityFields: row.priorityFields,
    simulationAuthorized: row.simulationAuthorized
  }, expected, 'pinned scenario mismatch: ' + row.scenario);
  assert.equal(row.findingCount, Object.values(expected.severityCounts).reduce((a, b) => a + b, 0));
  assert.equal(row.categoryCount, expected.categoryNames.length);
}
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(baseline[flag], false);
  assert.equal(matrix[flag], false);
}
const snapshot = JSON.stringify(baseline);
assert.throws(() => { baseline.expectations.clean.severityCounts.critical = 10; }, TypeError);
assert.throws(() => { baseline.expectations.mixedPriority.categoryNames.push('tamper'); }, TypeError);
assert.throws(() => { baseline.scenarioNames.reverse(); }, TypeError);
assert.equal(JSON.stringify(baseline), snapshot);
matrix.rows[1].priorityFields.push('TAMPER');
assert.equal(JSON.stringify(baseline), snapshot);
assert.deepEqual(createDiagnosticTriagePriorityDriftSummaryFixtureMatrix().rows.map(row => row.scenario), baseline.scenarioNames);
console.log('Mission 692 independent pinned summary baseline tests passed.');
