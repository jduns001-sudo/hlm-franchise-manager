'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonReport: compare } = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-report');
const { createDiagnosticTriagePriorityDriftSummaryFixtureMatrix: fixture } = require('./hlm-diagnostic-triage-priority-drift-summary-fixture-matrix');

const clean = compare();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.deepEqual(clean.findings, []);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) assert.equal(clean[flag], false);
assert.deepEqual(compare(), clean);

const input = fixture();
const original = JSON.stringify(input);
input.version = 2;
input.simulationAuthorized = true;
input.sourceStateMutated = true;
input.persistencePerformed = true;
input.rows.reverse();
const mixed = input.rows.find(row => row.scenario === 'mixedPriority');
mixed.severityCounts.high = 9;
mixed.categoryNames.reverse();
mixed.priorityFields.push('unexpected');
mixed.simulationAuthorized = true;
const result = compare(input);
assert.equal(result.hasDrift, true);
assert.deepEqual(result.findings.map(f => [f.scenario, f.field, f.code]), [
  [null, 'version', 'SUMMARY_MATRIX_METADATA_CHANGED'],
  [null, 'simulationAuthorized', 'SUMMARY_SAFETY_INVARIANT_CHANGED'],
  [null, 'sourceStateMutated', 'SUMMARY_SAFETY_INVARIANT_CHANGED'],
  [null, 'persistencePerformed', 'SUMMARY_SAFETY_INVARIANT_CHANGED'],
  [null, 'scenarioNames', 'SUMMARY_SCENARIO_ORDER_CHANGED'],
  ['mixedPriority', 'severityCounts.high', 'SUMMARY_SEVERITY_COUNT_CHANGED'],
  ['mixedPriority', 'categoryNames', 'SUMMARY_CATEGORY_ORDER_CHANGED'],
  ['mixedPriority', 'priorityFields', 'SUMMARY_PRIORITY_FIELDS_CHANGED'],
  ['mixedPriority', 'simulationAuthorized', 'SUMMARY_SAFETY_INVARIANT_CHANGED']
]);
assert.equal(result.findingCount, 9);
assert.equal(JSON.stringify(input), JSON.stringify(input), 'input remains serializable');
const before = JSON.stringify(input);
assert.deepEqual(compare(input), result);
assert.equal(JSON.stringify(input), before);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) assert.equal(result[flag], false);
result.findings.find(f => f.field === 'categoryNames').actual.push('TAMPER');
result.findings.find(f => f.field === 'scenarioNames').expected.push('TAMPER');
assert.equal(JSON.stringify(input), before);
assert(!JSON.stringify(compare(input)).includes('TAMPER'));

const missing = fixture();
missing.rows = missing.rows.filter(row => row.scenario !== 'clean');
const missingReport = compare(missing);
assert(missingReport.findings.some(f => f.scenario === 'clean' && f.code === 'SUMMARY_SCENARIO_MISSING_OR_DUPLICATED'));
const duplicate = fixture();
duplicate.rows.push({ ...duplicate.rows[0] });
const duplicateReport = compare(duplicate);
assert(duplicateReport.findings.some(f => f.scenario === 'clean' && f.actual === 2 &&
  f.code === 'SUMMARY_SCENARIO_MISSING_OR_DUPLICATED'));
const malformed = fixture();
malformed.rows.find(row => row.scenario === 'clean').severityCounts = null;
malformed.rows.find(row => row.scenario === 'clean').categoryNames = 'not-an-array';
assert(compare(malformed).findings.some(f => f.field === 'severityCounts.critical'));
assert(compare(malformed).findings.some(f => f.field === 'categoryNames'));
assert.throws(() => compare(null), { code: 'INVALID_PRIORITY_DRIFT_SUMMARY_FIXTURE_MATRIX' });
assert.throws(() => compare({ rows: 'bad' }), { code: 'INVALID_PRIORITY_DRIFT_SUMMARY_FIXTURE_MATRIX' });
assert.equal(JSON.stringify(fixture()), original);
console.log('Mission 693 priority drift summary comparison report tests passed.');
