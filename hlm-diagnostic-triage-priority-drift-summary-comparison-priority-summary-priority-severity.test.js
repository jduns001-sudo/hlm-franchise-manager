'use strict';
const assert = require('node:assert/strict');
const {
  classifyPrioritySummaryPriorityDriftFinding: classify,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPrioritySeverityReport: severity
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix');

const clean = severity();
assert.equal(clean.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-severity-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.findings, []);
assert.deepEqual(severity(), clean);

const samples = [
  ['PRIORITY_SUMMARY_PRIORITY_SAFETY_INVARIANT_CHANGED', 'simulationAuthorized', 'critical', 'safety-invariant'],
  ['PRIORITY_SUMMARY_PRIORITY_BASELINE_CHANGED', 'highestSeverity', 'high', 'diagnostic-regression'],
  ['PRIORITY_SUMMARY_PRIORITY_SEVERITY_COUNT_CHANGED', 'severityCounts.high', 'high', 'diagnostic-regression'],
  ['PRIORITY_SUMMARY_PRIORITY_FIELDS_CHANGED', 'priorityFields', 'high', 'diagnostic-regression'],
  ['PRIORITY_SUMMARY_URGENT_FIELDS_CHANGED', 'urgentFields', 'high', 'diagnostic-regression'],
  ['PRIORITY_SUMMARY_PRIORITY_SCENARIO_ORDER_CHANGED', 'scenarioNames', 'medium', 'ordering-or-count'],
  ['PRIORITY_SUMMARY_PRIORITY_SCENARIO_MISSING_OR_DUPLICATED', 'scenario', 'medium', 'ordering-or-count'],
  ['PRIORITY_SUMMARY_PRIORITY_CATEGORY_ORDER_CHANGED', 'categoryNames', 'medium', 'ordering-or-count'],
  ['PRIORITY_SUMMARY_PRIORITY_BASELINE_CHANGED', 'findingCount', 'medium', 'ordering-or-count'],
  ['PRIORITY_SUMMARY_PRIORITY_MATRIX_METADATA_CHANGED', 'version', 'low', 'metadata-or-other']
];
for (const [code, field, level, category] of samples) {
  assert.deepEqual(classify({ code, field }), { severity: level, category });
}
const matrix = fixture();
matrix.version = 2;
matrix.simulationAuthorized = true;
matrix.rows.reverse();
const row = matrix.rows.find(item => item.scenario === 'mixedPriority');
row.highestSeverity = 'low';
row.severityCounts.high = 99;
row.categoryNames.reverse();
row.priorityFields.push('unexpected');
row.urgentFields.push('unexpected');
row.simulationAuthorized = true;
const drift = compare(matrix);
const original = JSON.stringify(drift);
const result = severity(drift);
assert.equal(result.hasDrift, true);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, { critical: 2, high: 4, medium: 2, low: 1 });
assert.equal(result.findingCount, 9);
assert.deepEqual(result.findings.map(item => [item.originalIndex, item.field, item.severity]), [
  [0, 'version', 'low'],
  [1, 'simulationAuthorized', 'critical'],
  [2, 'scenarioNames', 'medium'],
  [3, 'highestSeverity', 'high'],
  [4, 'severityCounts.high', 'high'],
  [5, 'categoryNames', 'medium'],
  [6, 'priorityFields', 'high'],
  [7, 'urgentFields', 'high'],
  [8, 'simulationAuthorized', 'critical']
]);
assert.equal(JSON.stringify(drift), original);
assert.deepEqual(severity(drift), result);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
  assert.equal(clean[flag], false);
}
const category = result.findings.find(item => item.field === 'categoryNames');
const originalCategory = drift.findings.find(item => item.field === 'categoryNames');
assert.notStrictEqual(category.expected, originalCategory.expected);
assert.notStrictEqual(category.actual, originalCategory.actual);
category.expected.push('TAMPER');
category.actual.push('TAMPER');
assert.equal(JSON.stringify(drift), original);
assert(!JSON.stringify(severity(drift)).includes('TAMPER'));
assert.deepEqual(severity(), clean);
for (const invalid of [null, [], {}, { kind: 'wrong', findings: [], findingCount: 0 },
  { kind: drift.kind, findings: null, findingCount: 0 },
  { kind: drift.kind, findings: [], findingCount: 1 }]) {
  assert.throws(() => severity(invalid), { code: 'INVALID_PRIORITY_SUMMARY_PRIORITY_DRIFT_REPORT' });
}
for (const invalid of [null, [], {}, { field: 7, code: 'x' }, { field: 'x', code: null }]) {
  assert.throws(() => classify(invalid), { code: 'INVALID_PRIORITY_SUMMARY_PRIORITY_DRIFT_FINDING' });
}
console.log('Mission 712 priority summary priority severity tests passed.');
