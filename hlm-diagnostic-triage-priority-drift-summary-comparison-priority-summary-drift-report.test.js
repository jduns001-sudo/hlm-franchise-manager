'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix');

const clean = compare();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-drift-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.deepEqual(clean.findings, []);
assert.deepEqual(compare(), clean);
const matrix = fixture();
const snapshot = JSON.stringify(matrix);
matrix.version = 2;
matrix.scenarioCount = 99;
matrix.simulationAuthorized = true;
matrix.sourceStateMutated = true;
matrix.persistencePerformed = true;
matrix.rows.reverse();
const mixed = matrix.rows.find(row => row.scenario === 'mixedPriority');
mixed.hasDrift = false;
mixed.findingCount++;
mixed.highestSeverity = 'low';
mixed.categoryCount++;
mixed.severityCounts.high++;
mixed.categoryNames.reverse();
mixed.priorityFields.push('unexpected');
mixed.urgentFields.push('unexpected');
mixed.simulationAuthorized = true;
const report = compare(matrix);
assert.equal(report.hasDrift, true);
assert.equal(report.findingCount, 15);
assert.deepEqual(report.findings.map(f => [f.scenario, f.field, f.code]), [
  [null, 'version', 'PRIORITY_SUMMARY_MATRIX_METADATA_CHANGED'],
  [null, 'scenarioCount', 'PRIORITY_SUMMARY_MATRIX_METADATA_CHANGED'],
  [null, 'simulationAuthorized', 'PRIORITY_SUMMARY_SAFETY_INVARIANT_CHANGED'],
  [null, 'sourceStateMutated', 'PRIORITY_SUMMARY_SAFETY_INVARIANT_CHANGED'],
  [null, 'persistencePerformed', 'PRIORITY_SUMMARY_SAFETY_INVARIANT_CHANGED'],
  [null, 'scenarioNames', 'PRIORITY_SUMMARY_SCENARIO_ORDER_CHANGED'],
  ['mixedPriority', 'hasDrift', 'PRIORITY_SUMMARY_BASELINE_CHANGED'],
  ['mixedPriority', 'findingCount', 'PRIORITY_SUMMARY_BASELINE_CHANGED'],
  ['mixedPriority', 'highestSeverity', 'PRIORITY_SUMMARY_BASELINE_CHANGED'],
  ['mixedPriority', 'categoryCount', 'PRIORITY_SUMMARY_BASELINE_CHANGED'],
  ['mixedPriority', 'severityCounts.high', 'PRIORITY_SUMMARY_SEVERITY_COUNT_CHANGED'],
  ['mixedPriority', 'categoryNames', 'PRIORITY_SUMMARY_CATEGORY_ORDER_CHANGED'],
  ['mixedPriority', 'priorityFields', 'PRIORITY_SUMMARY_PRIORITY_FIELDS_CHANGED'],
  ['mixedPriority', 'urgentFields', 'PRIORITY_SUMMARY_URGENT_FIELDS_CHANGED'],
  ['mixedPriority', 'simulationAuthorized', 'PRIORITY_SUMMARY_SAFETY_INVARIANT_CHANGED']
]);
assert.equal(report.findingCount, report.findings.length);
assert.deepEqual(report.findings.find(f => f.field === 'scenarioNames').expected,
  ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority']);
assert.equal(report.findings.find(f => f.field === 'severityCounts.high').expected, 4);
assert.equal(report.findings.find(f => f.field === 'severityCounts.high').actual, 5);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
const before = JSON.stringify(matrix);
report.findings.find(f => f.field === 'scenarioNames').actual.push('TAMPER');
report.findings.find(f => f.field === 'categoryNames').expected.push('TAMPER');
report.findings.find(f => f.field === 'urgentFields').actual.push('TAMPER');
assert.equal(JSON.stringify(matrix), before);
assert(!JSON.stringify(compare(matrix)).includes('TAMPER'));
assert.notEqual(snapshot, before);
const missing = fixture();
missing.rows = missing.rows.filter(row => row.scenario !== 'clean');
const missingReport = compare(missing);
assert(missingReport.findings.some(f => f.scenario === 'clean' &&
  f.code === 'PRIORITY_SUMMARY_SCENARIO_MISSING_OR_DUPLICATED' && f.actual === 0));
const duplicate = fixture();
duplicate.rows.push({ ...duplicate.rows[0] });
const duplicateReport = compare(duplicate);
assert(duplicateReport.findings.some(f => f.scenario === 'clean' &&
  f.code === 'PRIORITY_SUMMARY_SCENARIO_MISSING_OR_DUPLICATED' && f.actual === 2));
const malformed = fixture();
malformed.rows[0].severityCounts = null;
malformed.rows[0].categoryNames = null;
malformed.rows[0].priorityFields = null;
malformed.rows[0].urgentFields = null;
const malformedReport = compare(malformed);
assert(malformedReport.findings.some(f => f.field === 'severityCounts.critical'));
assert(malformedReport.findings.some(f => f.field === 'categoryNames'));
assert(malformedReport.findings.some(f => f.field === 'priorityFields'));
assert(malformedReport.findings.some(f => f.field === 'urgentFields'));
for (const invalid of [null, [], {}, { rows: null }]) {
  assert.throws(() => compare(invalid), { code: 'INVALID_PRIORITY_SUMMARY_FIXTURE_MATRIX' });
}
console.log('Mission 705 priority summary drift report tests passed.');
