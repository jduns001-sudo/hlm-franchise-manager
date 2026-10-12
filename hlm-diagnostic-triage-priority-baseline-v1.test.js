'use strict';
const assert = require('node:assert/strict');
const { PRIORITY_EXPECTED_BASELINE_V1: baseline } = require('./hlm-diagnostic-triage-priority-baseline-v1');
const { createDiagnosticTriagePriorityFixtureMatrix } = require('./hlm-diagnostic-triage-priority-fixture-matrix');

// Independently pinned contract values: never update expected data from runtime output.
assert.equal(baseline.kind, 'franchise-diagnostic-triage-priority-expected-baseline');
assert.equal(baseline.version, 1);
assert.equal(baseline.matrixVersion, 1);
assert.deepEqual(baseline.scenarioNames, [
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);
assert(Object.isFrozen(baseline));
assert(Object.isFrozen(baseline.scenarioNames));
assert(Object.isFrozen(baseline.expectations));
for (const name of baseline.scenarioNames) {
  const entry = baseline.expectations[name];
  assert(Object.isFrozen(entry), name);
  assert(Object.isFrozen(entry.severityCounts), name);
  assert(Object.isFrozen(entry.categoryNames), name);
  assert(Object.isFrozen(entry.priorityFields), name);
  assert.equal(entry.simulationAuthorized, false, name);
}
assert.equal(baseline.simulationAuthorized, false);
assert.equal(baseline.sourceStateMutated, false);
assert.equal(baseline.persistencePerformed, false);

// Assert exact pinned values, independently of the matrix producer.
assert.deepEqual(baseline.expectations.clean, {
  hasDrift: false, findingCount: 0, highestSeverity: null,
  severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
  categoryCount: 0, categoryNames: [], priorityFields: [], simulationAuthorized: false
});
assert.deepEqual(baseline.expectations.safetyViolation, {
  hasDrift: true, findingCount: 1, highestSeverity: 'critical',
  severityCounts: { critical: 1, high: 0, medium: 0, low: 0 },
  categoryCount: 1, categoryNames: ['safety-invariant'],
  priorityFields: ['simulationAuthorized'], simulationAuthorized: false
});
assert.deepEqual(baseline.expectations.diagnosticRegression, {
  hasDrift: true, findingCount: 2, highestSeverity: 'high',
  severityCounts: { critical: 0, high: 2, medium: 0, low: 0 },
  categoryCount: 1, categoryNames: ['diagnostic-regression'],
  priorityFields: ['highestSeverity', 'severityCounts.high'], simulationAuthorized: false
});
assert.deepEqual(baseline.expectations.orderingChange, {
  hasDrift: true, findingCount: 1, highestSeverity: 'medium',
  severityCounts: { critical: 0, high: 0, medium: 1, low: 0 },
  categoryCount: 1, categoryNames: ['ordering-or-count'],
  priorityFields: ['categoryNames'], simulationAuthorized: false
});
assert.deepEqual(baseline.expectations.mixedPriority, {
  hasDrift: true, findingCount: 5, highestSeverity: 'critical',
  severityCounts: { critical: 1, high: 2, medium: 1, low: 1 },
  categoryCount: 4,
  categoryNames: ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'],
  priorityFields: ['simulationAuthorized'], simulationAuthorized: false
});

const matrix = createDiagnosticTriagePriorityFixtureMatrix();
const baselineBefore = JSON.stringify(baseline);
assert.equal(matrix.kind, 'franchise-diagnostic-triage-priority-fixture-matrix');
assert.equal(matrix.version, baseline.matrixVersion);
assert.equal(matrix.scenarioCount, baseline.scenarioNames.length);
assert.deepEqual(matrix.rows.map(row => row.scenario), baseline.scenarioNames);
for (const row of matrix.rows) {
  assert.deepEqual(
    {
      hasDrift: row.hasDrift, findingCount: row.findingCount,
      highestSeverity: row.highestSeverity, severityCounts: row.severityCounts,
      categoryCount: row.categoryCount, categoryNames: row.categoryNames,
      priorityFields: row.priorityFields, simulationAuthorized: row.simulationAuthorized
    },
    baseline.expectations[row.scenario],
    row.scenario
  );
}
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(matrix[flag], baseline[flag], flag);
}
matrix.rows[1].severityCounts.critical = 99;
matrix.rows[4].categoryNames.push('TAMPER');
assert.equal(JSON.stringify(baseline), baselineBefore, 'baseline must be independent of runtime output');
assert.equal(baseline.expectations.safetyViolation.severityCounts.critical, 1);
assert(!baseline.expectations.mixedPriority.categoryNames.includes('TAMPER'));

// Frozen structures reject mutation in strict mode.
assert.throws(() => { baseline.expectations.clean.findingCount = 3; }, TypeError);
assert.throws(() => { baseline.expectations.mixedPriority.categoryNames.push('TAMPER'); }, TypeError);
assert.throws(() => { baseline.scenarioNames.reverse(); }, TypeError);
console.log('Mission 686 independent triage priority baseline tests passed.');
