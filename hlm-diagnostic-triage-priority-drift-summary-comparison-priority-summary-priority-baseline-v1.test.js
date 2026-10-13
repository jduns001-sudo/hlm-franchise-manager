'use strict';
const assert = require('node:assert/strict');
const { PRIORITY_SUMMARY_PRIORITY_EXPECTED_BASELINE_V1: baseline } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-baseline-v1');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix: matrix } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix');

const names = ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'];
assert.equal(baseline.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-expected-baseline');
assert.equal(baseline.version, 1);
assert.equal(baseline.matrixVersion, 1);
assert.deepEqual(baseline.scenarioNames, names);
assert.deepEqual(Object.keys(baseline.expectations), names);
const literal = {
  clean: [false, 0, null, [0, 0, 0, 0], 0, [], [], []],
  safetyViolation: [true, 1, 'critical', [1, 0, 0, 0], 1,
    ['safety-invariant'], ['simulationAuthorized'], ['simulationAuthorized']],
  diagnosticRegression: [true, 3, 'high', [0, 3, 0, 0], 1,
    ['diagnostic-regression'],
    ['highestSeverity', 'severityCounts.high', 'priorityFields'],
    ['highestSeverity', 'severityCounts.high', 'priorityFields']],
  orderingChange: [true, 2, 'medium', [0, 0, 2, 0], 1,
    ['ordering-or-count'], ['scenarioNames', 'categoryNames'], []],
  mixedPriority: [true, 7, 'critical', [1, 3, 2, 1], 4,
    ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'],
    ['simulationAuthorized'],
    ['simulationAuthorized', 'highestSeverity', 'severityCounts.high', 'priorityFields']]
};
const projection = row => [
  row.hasDrift, row.findingCount, row.highestSeverity,
  ['critical', 'high', 'medium', 'low'].map(level => row.severityCounts[level]),
  row.categoryCount, row.categoryNames, row.priorityFields, row.urgentFields
];
for (const name of names) {
  assert.deepEqual(projection(baseline.expectations[name]), literal[name]);
  assert.equal(baseline.expectations[name].simulationAuthorized, false);
}
const generated = matrix();
assert.equal(generated.version, baseline.matrixVersion);
assert.equal(generated.scenarioCount, names.length);
assert.deepEqual(generated.rows.map(row => row.scenario), baseline.scenarioNames);
for (const row of generated.rows) {
  assert.deepEqual(projection(row), projection(baseline.expectations[row.scenario]));
  assert.equal(row.simulationAuthorized, baseline.expectations[row.scenario].simulationAuthorized);
}
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(baseline[flag], false);
  assert.equal(generated[flag], false);
}
function assertDeepFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert(Object.isFrozen(value));
  for (const child of Object.values(value)) assertDeepFrozen(child);
}
assertDeepFrozen(baseline);
assert.throws(() => { baseline.version = 2; }, TypeError);
assert.throws(() => { baseline.scenarioNames.reverse(); }, TypeError);
assert.throws(() => { baseline.expectations.mixedPriority.severityCounts.critical = 999; }, TypeError);
assert.throws(() => { baseline.expectations.mixedPriority.urgentFields.push('TAMPER'); }, TypeError);
assert.throws(() => { baseline.expectations.clean = null; }, TypeError);
const before = JSON.stringify(baseline);
generated.rows[4].urgentFields.push('TAMPER');
generated.rows[4].severityCounts.critical = 999;
generated.rows.reverse();
assert.equal(JSON.stringify(baseline), before);
assert(!JSON.stringify(baseline).includes('TAMPER'));
assert.deepEqual(matrix().rows.map(row => projection(row)),
  names.map(name => projection(baseline.expectations[name])));
console.log('Mission 710 independently pinned priority summary baseline tests passed.');
