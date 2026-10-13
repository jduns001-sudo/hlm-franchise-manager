'use strict';
const assert = require('node:assert/strict');
const {
  PRIORITY_SUMMARY_FINAL_SCENARIO_NAMES: names,
  createPrioritySummaryFinalScenarioInput: input,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityFixtureMatrix: matrix
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-fixture-matrix');

assert.deepEqual(names, ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority']);
assert(Object.isFrozen(names));
const expected = [
  ['clean', false, 0, null, [0,0,0,0], 0, [], [], []],
  ['safetyViolation', true, 1, 'critical', [1,0,0,0], 1,
    ['safety-invariant'], ['simulationAuthorized'], ['simulationAuthorized']],
  ['diagnosticRegression', true, 3, 'high', [0,3,0,0], 1,
    ['diagnostic-regression'], ['highestSeverity','severityCounts.high','priorityFields'],
    ['highestSeverity','severityCounts.high','priorityFields']],
  ['orderingChange', true, 2, 'medium', [0,0,2,0], 1,
    ['ordering-or-count'], ['scenarioNames','categoryNames'], []],
  ['mixedPriority', true, 7, 'critical', [1,3,2,1], 4,
    ['safety-invariant','diagnostic-regression','ordering-or-count','metadata-or-other'],
    ['simulationAuthorized'],
    ['simulationAuthorized','highestSeverity','severityCounts.high','priorityFields']]
];
const result = matrix();
assert.equal(result.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-fixture-matrix');
assert.equal(result.version, 1);
assert.equal(result.scenarioCount, 5);
assert.equal(result.rows.length, 5);
assert.deepEqual(result.rows.map(row => [
  row.scenario, row.hasDrift, row.findingCount, row.highestSeverity,
  [row.severityCounts.critical,row.severityCounts.high,row.severityCounts.medium,row.severityCounts.low],
  row.categoryCount, row.categoryNames, row.priorityFields, row.urgentFields
]), expected);
for (const row of result.rows) assert.equal(row.simulationAuthorized, false);
for (const flag of ['simulationAuthorized','sourceStateMutated','persistencePerformed']) assert.equal(result[flag], false);
assert.deepEqual(matrix(), result);

for (const [scenario, , count] of expected) {
  const a = input(scenario), b = input(scenario);
  assert.equal(a.kind,
    'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-severity-report');
  assert.equal(a.findingCount, count);
  assert.equal(a.findings.length, count);
  assert.equal(a.version, 1);
  assert.equal(a.baselineVersion, 1);
  assert.equal(a.matrixVersion, 1);
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(a.findings, b.findings);
  assert.deepEqual(a, b);
  for (let i=0; i<count; i++) {
    assert.notStrictEqual(a.findings[i], b.findings[i]);
    assert.notStrictEqual(a.findings[i].expected, b.findings[i].expected);
    assert.notStrictEqual(a.findings[i].actual, b.findings[i].actual);
  }
  if (count) {
    a.findings[0].expected.push('TAMPER');
    a.findings[0].actual.push('TAMPER');
    a.findings[0].field = 'TAMPER';
    assert.deepEqual(input(scenario), b);
  }
}
const second = matrix();
assert.notStrictEqual(result, second);
assert.notStrictEqual(result.rows, second.rows);
assert.notStrictEqual(result.rows[4], second.rows[4]);
assert.notStrictEqual(result.rows[4].severityCounts, second.rows[4].severityCounts);
assert.notStrictEqual(result.rows[4].categoryNames, second.rows[4].categoryNames);
assert.notStrictEqual(result.rows[4].priorityFields, second.rows[4].priorityFields);
assert.notStrictEqual(result.rows[4].urgentFields, second.rows[4].urgentFields);
result.rows[4].categoryNames.push('TAMPER');
result.rows[4].severityCounts.critical = 999;
result.rows[4].priorityFields.push('TAMPER');
result.rows[4].urgentFields.push('TAMPER');
result.rows.reverse();
assert.deepEqual(matrix(), second);
for (const bad of [null, undefined, '', 'unknown', 'Clean', 1, {}]) {
  assert.throws(() => input(bad), { code: 'UNKNOWN_PRIORITY_SUMMARY_FINAL_SCENARIO' });
}
console.log('Mission 715 fictional priority summary fixture matrix tests passed.');
