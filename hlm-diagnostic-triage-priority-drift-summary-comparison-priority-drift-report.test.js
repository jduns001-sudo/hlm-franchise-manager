'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');

const clean = compare();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.deepEqual(clean.findings, []);
assert.deepEqual(compare(), clean);

const input = fixture();
const original = JSON.stringify(input);
input.version = 2;
input.simulationAuthorized = true;
input.sourceStateMutated = true;
input.persistencePerformed = true;
input.rows.reverse();
const mixed = input.rows.find(row => row.scenario === 'mixedPriority');
mixed.findingCount += 1;
mixed.highestSeverity = 'medium';
mixed.severityCounts.high += 1;
mixed.categoryCount += 1;
mixed.categoryNames.reverse();
mixed.priorityFields.push('unexpected-priority');
mixed.urgentFields.push('unexpected-urgent');
mixed.simulationAuthorized = true;
const result = compare(input);
assert.equal(result.hasDrift, true);
assert.deepEqual(result.findings.map(f => [f.scenario, f.field, f.code]), [
  [null, 'version', 'PRIORITY_MATRIX_METADATA_CHANGED'],
  [null, 'simulationAuthorized', 'PRIORITY_SAFETY_INVARIANT_CHANGED'],
  [null, 'sourceStateMutated', 'PRIORITY_SAFETY_INVARIANT_CHANGED'],
  [null, 'persistencePerformed', 'PRIORITY_SAFETY_INVARIANT_CHANGED'],
  [null, 'scenarioNames', 'PRIORITY_SCENARIO_ORDER_CHANGED'],
  ['mixedPriority', 'findingCount', 'PRIORITY_BASELINE_CHANGED'],
  ['mixedPriority', 'highestSeverity', 'PRIORITY_BASELINE_CHANGED'],
  ['mixedPriority', 'categoryCount', 'PRIORITY_BASELINE_CHANGED'],
  ['mixedPriority', 'severityCounts.high', 'PRIORITY_SEVERITY_COUNT_CHANGED'],
  ['mixedPriority', 'categoryNames', 'PRIORITY_CATEGORY_ORDER_CHANGED'],
  ['mixedPriority', 'priorityFields', 'PRIORITY_FIELDS_CHANGED'],
  ['mixedPriority', 'urgentFields', 'PRIORITY_URGENT_FIELDS_CHANGED'],
  ['mixedPriority', 'simulationAuthorized', 'PRIORITY_SAFETY_INVARIANT_CHANGED']
]);
assert.equal(result.findingCount, 13);
const snapshot = JSON.stringify(input);
assert.deepEqual(compare(input), result);
assert.equal(JSON.stringify(input), snapshot);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.findings.find(f => f.field === 'categoryNames').actual.push('TAMPER');
result.findings.find(f => f.field === 'scenarioNames').expected.push('TAMPER');
result.findings.find(f => f.field === 'urgentFields').actual.push('TAMPER');
assert.equal(JSON.stringify(input), snapshot);
assert(!JSON.stringify(compare(input)).includes('TAMPER'));

const missing = fixture();
missing.rows = missing.rows.filter(row => row.scenario !== 'clean');
assert(compare(missing).findings.some(f => f.scenario === 'clean' &&
  f.code === 'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED'));
const duplicate = fixture();
duplicate.rows.push({ ...duplicate.rows[0] });
assert(compare(duplicate).findings.some(f => f.scenario === 'clean' && f.actual === 2 &&
  f.code === 'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED'));
const malformed = fixture();
const row = malformed.rows.find(r => r.scenario === 'clean');
row.severityCounts = null;
row.categoryNames = 'not-an-array';
row.priorityFields = null;
row.urgentFields = null;
assert(compare(malformed).findings.some(f => f.field === 'severityCounts.critical'));
assert(compare(malformed).findings.some(f => f.field === 'categoryNames'));
assert(compare(malformed).findings.some(f => f.field === 'priorityFields'));
assert(compare(malformed).findings.some(f => f.field === 'urgentFields'));
assert.throws(() => compare(null), { code: 'INVALID_SUMMARY_COMPARISON_PRIORITY_FIXTURE_MATRIX' });
assert.throws(() => compare({ rows: 'bad' }), { code: 'INVALID_SUMMARY_COMPARISON_PRIORITY_FIXTURE_MATRIX' });
assert.equal(JSON.stringify(fixture()), original);
console.log('Mission 699 priority fixture baseline drift report tests passed.');
