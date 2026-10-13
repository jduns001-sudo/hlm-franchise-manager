'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix');

const clean = compare();
assert.equal(clean.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-drift-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.deepEqual(clean.findings, []);
assert.deepEqual(compare(), clean);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(clean[flag], false);
}

const changed = fixture();
changed.kind = 'different-kind';
changed.version = 2;
changed.scenarioCount = 6;
changed.simulationAuthorized = true;
changed.sourceStateMutated = true;
changed.persistencePerformed = true;
changed.rows.reverse();
const row = changed.rows.find(item => item.scenario === 'mixedPriority');
row.hasDrift = false;
row.findingCount = 99;
row.highestSeverity = 'low';
row.categoryCount = 9;
row.severityCounts.high = 5;
row.categoryNames.reverse();
row.priorityFields.push('unexpected-priority');
row.urgentFields.push('unexpected-urgent');
row.simulationAuthorized = true;
const before = JSON.stringify(changed);
const result = compare(changed);
assert.equal(result.hasDrift, true);
assert.equal(result.findingCount, 16);
assert.deepEqual(result.findings.map(f => [f.scenario, f.field, f.code]), [
  [null, 'kind', 'PRIORITY_SUMMARY_PRIORITY_MATRIX_METADATA_CHANGED'],
  [null, 'version', 'PRIORITY_SUMMARY_PRIORITY_MATRIX_METADATA_CHANGED'],
  [null, 'scenarioCount', 'PRIORITY_SUMMARY_PRIORITY_MATRIX_METADATA_CHANGED'],
  [null, 'simulationAuthorized', 'PRIORITY_SUMMARY_PRIORITY_SAFETY_INVARIANT_CHANGED'],
  [null, 'sourceStateMutated', 'PRIORITY_SUMMARY_PRIORITY_SAFETY_INVARIANT_CHANGED'],
  [null, 'persistencePerformed', 'PRIORITY_SUMMARY_PRIORITY_SAFETY_INVARIANT_CHANGED'],
  [null, 'scenarioNames', 'PRIORITY_SUMMARY_PRIORITY_SCENARIO_ORDER_CHANGED'],
  ['mixedPriority', 'hasDrift', 'PRIORITY_SUMMARY_PRIORITY_BASELINE_CHANGED'],
  ['mixedPriority', 'findingCount', 'PRIORITY_SUMMARY_PRIORITY_BASELINE_CHANGED'],
  ['mixedPriority', 'highestSeverity', 'PRIORITY_SUMMARY_PRIORITY_BASELINE_CHANGED'],
  ['mixedPriority', 'categoryCount', 'PRIORITY_SUMMARY_PRIORITY_BASELINE_CHANGED'],
  ['mixedPriority', 'severityCounts.high', 'PRIORITY_SUMMARY_PRIORITY_SEVERITY_COUNT_CHANGED'],
  ['mixedPriority', 'categoryNames', 'PRIORITY_SUMMARY_PRIORITY_CATEGORY_ORDER_CHANGED'],
  ['mixedPriority', 'priorityFields', 'PRIORITY_SUMMARY_PRIORITY_FIELDS_CHANGED'],
  ['mixedPriority', 'urgentFields', 'PRIORITY_SUMMARY_URGENT_FIELDS_CHANGED'],
  ['mixedPriority', 'simulationAuthorized', 'PRIORITY_SUMMARY_PRIORITY_SAFETY_INVARIANT_CHANGED']
]);
assert.equal(JSON.stringify(changed), before);
assert.deepEqual(compare(changed), result);
assert.equal(result.matrixVersion, 2);
assert.equal(result.baselineVersion, 1);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
const categoryFinding = result.findings.find(f => f.field === 'categoryNames');
assert.deepEqual(categoryFinding.expected,
  ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other']);
assert.deepEqual(categoryFinding.actual,
  ['metadata-or-other', 'ordering-or-count', 'diagnostic-regression', 'safety-invariant']);
const namesFinding = result.findings.find(f => f.field === 'scenarioNames');
assert.deepEqual(namesFinding.expected,
  ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority']);
assert.deepEqual(namesFinding.actual,
  ['mixedPriority', 'orderingChange', 'diagnosticRegression', 'safetyViolation', 'clean']);
categoryFinding.expected.push('TAMPER');
categoryFinding.actual.push('TAMPER');
namesFinding.expected.reverse();
namesFinding.actual.reverse();
assert.equal(JSON.stringify(changed), before);
assert(!JSON.stringify(compare(changed)).includes('TAMPER'));
assert.deepEqual(compare(), clean);

const missing = fixture();
missing.rows = missing.rows.filter(item => item.scenario !== 'clean');
const missingReport = compare(missing);
assert(missingReport.findings.some(f =>
  f.scenario === 'clean' && f.field === 'scenario' && f.expected === 1 && f.actual === 0 &&
  f.code === 'PRIORITY_SUMMARY_PRIORITY_SCENARIO_MISSING_OR_DUPLICATED'));
const duplicate = fixture();
duplicate.rows.push({ ...duplicate.rows[0] });
const duplicateReport = compare(duplicate);
assert(duplicateReport.findings.some(f =>
  f.scenario === 'clean' && f.field === 'scenario' && f.expected === 1 && f.actual === 2));
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
for (const invalid of [null, [], {}, { rows: null }, { rows: 'invalid' }]) {
  assert.throws(() => compare(invalid), { code: 'INVALID_PRIORITY_SUMMARY_PRIORITY_FIXTURE_MATRIX' });
}
console.log('Mission 711 priority summary priority drift report tests passed.');
