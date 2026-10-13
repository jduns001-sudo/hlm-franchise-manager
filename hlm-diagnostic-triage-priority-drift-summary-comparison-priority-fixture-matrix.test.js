'use strict';
const assert = require('node:assert/strict');
const {
  SUMMARY_COMPARISON_PRIORITY_SCENARIO_NAMES: names,
  createSummaryComparisonPriorityScenarioInput: scenario,
  createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix: matrix
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');
const { createDiagnosticTriagePriorityDriftSummaryFixtureMatrix: sourceMatrix } =
  require('./hlm-diagnostic-triage-priority-drift-summary-fixture-matrix');

assert(Object.isFrozen(names));
assert.deepEqual(names, ['clean', 'safetyViolation', 'diagnosticRegression',
  'orderingChange', 'mixedPriority']);
const original = sourceMatrix();
for (const name of names) {
  const first = scenario(name);
  assert.notStrictEqual(first, scenario(name));
  assert.notStrictEqual(first.rows, scenario(name).rows);
  assert.equal(first.rows.length, original.rows.length);
  assert.equal(first.rows.some(row => row.scenario === 'mixedPriority'), true);
  assert.deepEqual(scenario(name), first);
}
assert.deepEqual(scenario('clean'), original);
assert.equal(scenario('safetyViolation').simulationAuthorized, true);
const regression = scenario('diagnosticRegression').rows.find(row => row.scenario === 'mixedPriority');
const baselineRegression = original.rows.find(row => row.scenario === 'mixedPriority');
assert.equal(regression.severityCounts.high, baselineRegression.severityCounts.high + 1);
assert.equal(regression.highestSeverity, 'high');
assert(regression.priorityFields.includes('unexpected-priority'));
assert.deepEqual(scenario('orderingChange').rows.map(row => row.scenario),
  original.rows.map(row => row.scenario).reverse());
assert.equal(scenario('mixedPriority').simulationAuthorized, true);
assert.equal(scenario('mixedPriority').version, original.version + 1);
assert.deepEqual(sourceMatrix(), original);
assert.throws(() => scenario('missing'), { code: 'UNKNOWN_SUMMARY_COMPARISON_PRIORITY_SCENARIO' });
assert.throws(() => scenario(null), { code: 'UNKNOWN_SUMMARY_COMPARISON_PRIORITY_SCENARIO' });

const report = matrix();
assert.equal(report.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');
assert.equal(report.version, 1);
assert.equal(report.scenarioCount, 5);
assert.deepEqual(report.rows.map(row => row.scenario), names);
assert.equal(report.rows[0].hasDrift, false);
assert.equal(report.rows[0].findingCount, 0);
assert.equal(report.rows[0].highestSeverity, null);
assert.deepEqual(report.rows[0].severityCounts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(report.rows[0].categoryNames, []);
assert.deepEqual(report.rows[0].priorityFields, []);
assert.deepEqual(report.rows[0].urgentFields, []);
for (const row of report.rows) {
  assert.equal(row.simulationAuthorized, false);
  assert.equal(row.findingCount, Object.values(row.severityCounts).reduce((a, b) => a + b, 0));
  assert.equal(row.categoryCount, row.categoryNames.length);
  assert.equal(row.hasDrift, row.findingCount > 0);
  assert(row.urgentFields.length <= row.findingCount);
}
assert.equal(report.rows[1].highestSeverity, 'critical');
assert(report.rows[1].priorityFields.includes('simulationAuthorized'));
assert(report.rows[1].urgentFields.includes('simulationAuthorized'));
assert.equal(report.rows[2].highestSeverity, 'high');
assert(report.rows[2].urgentFields.includes('severityCounts.high'));
assert.equal(report.rows[3].highestSeverity, 'medium');
assert(report.rows[3].priorityFields.includes('scenarioNames'));
assert.equal(report.rows[4].highestSeverity, 'critical');
assert(report.rows[4].urgentFields.includes('simulationAuthorized'));
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
assert.deepEqual(matrix(), report);
report.rows[4].categoryNames.push('TAMPER');
report.rows[4].urgentFields.push('TAMPER');
assert(!JSON.stringify(matrix()).includes('TAMPER'));
assert.deepEqual(sourceMatrix(), original);
console.log('Mission 697 summary comparison priority fixture matrix tests passed.');
