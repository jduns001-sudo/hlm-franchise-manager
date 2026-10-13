'use strict';
const assert = require('node:assert/strict');
const { PRIORITY_SUMMARY_EXPECTED_BASELINE_V1: baseline } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-baseline-v1');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix');

const names = ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'];
const expected = {
  clean: [false, 0, null, [0, 0, 0, 0], [], [], []],
  safetyViolation: [true, 1, 'critical', [1, 0, 0, 0],
    ['safety-invariant'], ['simulationAuthorized'], ['simulationAuthorized']],
  diagnosticRegression: [true, 4, 'high', [0, 4, 0, 0],
    ['diagnostic-regression'],
    ['highestSeverity', 'severityCounts.high', 'priorityFields', 'urgentFields'],
    ['highestSeverity', 'severityCounts.high', 'priorityFields', 'urgentFields']],
  orderingChange: [true, 2, 'medium', [0, 0, 2, 0],
    ['ordering-or-count'], ['scenarioNames', 'categoryNames'], []],
  mixedPriority: [true, 8, 'critical', [1, 4, 2, 1],
    ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'],
    ['simulationAuthorized'],
    ['simulationAuthorized', 'highestSeverity', 'severityCounts.high', 'priorityFields', 'urgentFields']]
};
assert.equal(baseline.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-expected-baseline');
assert.equal(baseline.version, 1);
assert.equal(baseline.matrixVersion, 1);
assert.deepEqual(baseline.scenarioNames, names);
assert.deepEqual(Object.keys(baseline.expectations), names);
const matrix = fixture();
assert.equal(matrix.version, baseline.matrixVersion);
assert.equal(matrix.scenarioCount, names.length);
assert.deepEqual(matrix.rows.map(row => row.scenario), names);
for (const row of matrix.rows) {
  const pinned = baseline.expectations[row.scenario];
  const [hasDrift, findingCount, highestSeverity, levels, categories, priority, urgent] = expected[row.scenario];
  assert.equal(pinned.hasDrift, hasDrift);
  assert.equal(pinned.findingCount, findingCount);
  assert.equal(pinned.highestSeverity, highestSeverity);
  assert.deepEqual(pinned.severityCounts,
    { critical: levels[0], high: levels[1], medium: levels[2], low: levels[3] });
  assert.equal(pinned.categoryCount, categories.length);
  assert.deepEqual(pinned.categoryNames, categories);
  assert.deepEqual(pinned.priorityFields, priority);
  assert.deepEqual(pinned.urgentFields, urgent);
  assert.equal(pinned.simulationAuthorized, false);
  for (const key of ['hasDrift', 'findingCount', 'highestSeverity', 'severityCounts',
    'categoryCount', 'categoryNames', 'priorityFields', 'urgentFields', 'simulationAuthorized']) {
    assert.deepEqual(row[key], pinned[key], row.scenario + '.' + key);
  }
}
function verifyFrozen(node) {
  if (!node || typeof node !== 'object') return;
  assert(Object.isFrozen(node));
  for (const value of Object.values(node)) verifyFrozen(value);
}
verifyFrozen(baseline);
const snapshot = JSON.stringify(baseline);
assert.throws(() => { baseline.expectations.clean.severityCounts.high = 42; }, TypeError);
assert.throws(() => { baseline.scenarioNames.push('extra'); }, TypeError);
assert.throws(() => { baseline.expectations.mixedPriority.urgentFields.reverse(); }, TypeError);
assert.throws(() => { baseline.expectations.diagnosticRegression.categoryNames[0] = 'tampered'; }, TypeError);
matrix.rows[4].categoryNames.push('TAMPER');
matrix.rows[4].severityCounts.high = 999;
assert.equal(JSON.stringify(baseline), snapshot);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(baseline[flag], false);
  assert.equal(fixture()[flag], false);
}
assert.deepEqual(fixture().rows.map(row => row.scenario), names);
console.log('Mission 704 independently pinned priority summary baseline tests passed.');
