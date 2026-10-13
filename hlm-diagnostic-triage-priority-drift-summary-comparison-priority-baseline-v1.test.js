'use strict';
const assert = require('node:assert/strict');
const { SUMMARY_COMPARISON_PRIORITY_EXPECTED_BASELINE_V1: baseline } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-baseline-v1');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix: createMatrix } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');

function deeplyFrozen(value) {
  assert(Object.isFrozen(value));
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === 'object') deeplyFrozen(child);
  }
}
deeplyFrozen(baseline);
assert.equal(baseline.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-expected-baseline');
assert.equal(baseline.version, 1);
assert.equal(baseline.matrixVersion, 1);
assert.deepEqual(baseline.scenarioNames,
  ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority']);
assert.deepEqual(Object.keys(baseline.expectations), baseline.scenarioNames);
const matrix = createMatrix();
assert.equal(matrix.version, baseline.matrixVersion);
assert.equal(matrix.scenarioCount, baseline.scenarioNames.length);
assert.deepEqual(matrix.rows.map(row => row.scenario), baseline.scenarioNames);
for (const row of matrix.rows) {
  assert.deepEqual(
    { ...row, scenario: undefined },
    { ...baseline.expectations[row.scenario], scenario: undefined },
    'Pinned expectation mismatch for ' + row.scenario
  );
  assert.equal(row.findingCount,
    Object.values(row.severityCounts).reduce((sum, value) => sum + value, 0));
  assert.equal(row.categoryCount, row.categoryNames.length);
  assert.equal(row.simulationAuthorized, false);
}
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(baseline[flag], false);
  assert.equal(matrix[flag], false);
}
const before = JSON.stringify(baseline);
assert.throws(() => { baseline.expectations.clean.priorityFields.push('tamper'); }, TypeError);
assert.throws(() => { baseline.expectations.mixedPriority.severityCounts.critical = 99; }, TypeError);
assert.throws(() => { baseline.scenarioNames.reverse(); }, TypeError);
assert.equal(JSON.stringify(baseline), before);
assert.deepEqual(createMatrix(), matrix);
console.log('Mission 698 independent pinned priority baseline tests passed.');
