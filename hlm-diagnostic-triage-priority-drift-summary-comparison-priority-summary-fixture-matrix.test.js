'use strict';
const assert = require('node:assert/strict');
const {
  PRIORITY_SUMMARY_SCENARIO_NAMES: names,
  createPrioritySummaryScenarioInput: scenario,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix: matrix
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix: base } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');

assert(Object.isFrozen(names));
assert.deepEqual(names, ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority']);
const first = matrix();
assert.equal(first.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix');
assert.equal(first.version, 1);
assert.equal(first.scenarioCount, 5);
assert.deepEqual(first.rows.map(row => row.scenario), names);
assert.deepEqual(matrix(), first);
const baseline = base();
assert.deepEqual(scenario('clean'), baseline);
assert.equal(scenario('safetyViolation').simulationAuthorized, true);
const diagnostic = scenario('diagnosticRegression');
const mixedDiagnostic = diagnostic.rows.find(row => row.scenario === 'mixedPriority');
const originalMixed = baseline.rows.find(row => row.scenario === 'mixedPriority');
assert.equal(mixedDiagnostic.highestSeverity, 'medium');
assert.equal(mixedDiagnostic.severityCounts.high, originalMixed.severityCounts.high + 1);
assert.deepEqual(mixedDiagnostic.priorityFields, [...originalMixed.priorityFields, 'unexpected-priority']);
assert.deepEqual(mixedDiagnostic.urgentFields, [...originalMixed.urgentFields, 'unexpected-urgent']);
const ordered = scenario('orderingChange');
assert.deepEqual(ordered.rows.map(row => row.scenario), [...names].reverse());
assert.deepEqual(ordered.rows.find(row => row.scenario === 'mixedPriority').categoryNames,
  [...originalMixed.categoryNames].reverse());
const mixed = scenario('mixedPriority');
assert.equal(mixed.version, 2);
assert.equal(mixed.simulationAuthorized, true);
assert.deepEqual(mixed.rows.map(row => row.scenario), [...names].reverse());
assert.equal(mixed.rows.find(row => row.scenario === 'mixedPriority').severityCounts.high,
  originalMixed.severityCounts.high + 1);

const expectedSeverities = ['none', 'critical', 'high', 'medium', 'critical'];
assert.deepEqual(first.rows.map(row => row.highestSeverity || 'none'), expectedSeverities);
assert.deepEqual(first.rows.map(row => row.hasDrift), [false, true, true, true, true]);
assert.deepEqual(first.rows.map(row => row.findingCount), [0, 1, 4, 2, 8]);
assert.deepEqual(first.rows.map(row => row.severityCounts), [
  { critical: 0, high: 0, medium: 0, low: 0 },
  { critical: 1, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 4, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 1, high: 4, medium: 2, low: 1 }
]);
assert.deepEqual(first.rows.map(row => row.categoryNames), [
  [], ['safety-invariant'], ['diagnostic-regression'], ['ordering-or-count'],
  ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other']
]);
assert.deepEqual(first.rows.map(row => row.categoryCount), [0, 1, 1, 1, 4]);
assert.deepEqual(first.rows.map(row => row.priorityFields), [
  [], ['simulationAuthorized'],
  ['highestSeverity', 'severityCounts.high', 'priorityFields', 'urgentFields'],
  ['scenarioNames', 'categoryNames'], ['simulationAuthorized']
]);
assert.deepEqual(first.rows.map(row => row.urgentFields), [
  [], ['simulationAuthorized'],
  ['highestSeverity', 'severityCounts.high', 'priorityFields', 'urgentFields'],
  [], ['simulationAuthorized', 'highestSeverity', 'severityCounts.high', 'priorityFields', 'urgentFields']
]);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(first[flag], false);
}
for (const row of first.rows) {
  assert.equal(row.simulationAuthorized, false);
  assert.equal(Object.values(row.severityCounts).reduce((a, b) => a + b, 0), row.findingCount);
  assert.equal(row.categoryCount, row.categoryNames.length);
}
const saved = JSON.stringify(first);
const mutable = scenario('diagnosticRegression');
mutable.rows[0].categoryNames.push('TAMPER');
mutable.rows.find(row => row.scenario === 'mixedPriority').urgentFields.push('TAMPER');
first.rows[4].categoryNames.push('TAMPER');
first.rows[4].priorityFields.push('TAMPER');
first.rows[4].severityCounts.high = 999;
assert(!JSON.stringify(matrix()).includes('TAMPER'));
assert.deepEqual(base(), baseline);
assert.notEqual(JSON.stringify(first), saved);
assert.throws(() => scenario('unknown'), { code: 'UNKNOWN_PRIORITY_SUMMARY_SCENARIO' });
console.log('Mission 703 priority summary fixture matrix tests passed.');
