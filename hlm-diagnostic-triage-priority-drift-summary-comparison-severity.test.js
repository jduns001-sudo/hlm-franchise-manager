'use strict';
const assert = require('node:assert/strict');
const {
  classifySummaryComparisonFinding: classify,
  createDiagnosticTriagePriorityDriftSummaryComparisonSeverityReport: severity
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonReport: compare } = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-report');
const { createDiagnosticTriagePriorityDriftSummaryFixtureMatrix: fixture } = require('./hlm-diagnostic-triage-priority-drift-summary-fixture-matrix');

assert.deepEqual(classify({ field: 'simulationAuthorized', code: 'SUMMARY_SAFETY_INVARIANT_CHANGED' }),
  { severity: 'critical', category: 'safety-invariant' });
assert.deepEqual(classify({ field: 'sourceStateMutated', code: 'X' }),
  { severity: 'critical', category: 'safety-invariant' });
assert.deepEqual(classify({ field: 'persistencePerformed', code: 'X' }),
  { severity: 'critical', category: 'safety-invariant' });
assert.deepEqual(classify({ field: 'highestSeverity', code: 'SUMMARY_BASELINE_CHANGED' }),
  { severity: 'high', category: 'diagnostic-regression' });
assert.deepEqual(classify({ field: 'severityCounts.low', code: 'X' }),
  { severity: 'high', category: 'diagnostic-regression' });
assert.deepEqual(classify({ field: 'priorityFields', code: 'SUMMARY_PRIORITY_FIELDS_CHANGED' }),
  { severity: 'high', category: 'diagnostic-regression' });
assert.deepEqual(classify({ field: 'scenarioNames', code: 'SUMMARY_SCENARIO_ORDER_CHANGED' }),
  { severity: 'medium', category: 'ordering-or-count' });
assert.deepEqual(classify({ field: 'scenario', code: 'SUMMARY_SCENARIO_MISSING_OR_DUPLICATED' }),
  { severity: 'medium', category: 'ordering-or-count' });
assert.deepEqual(classify({ field: 'categoryNames', code: 'SUMMARY_CATEGORY_ORDER_CHANGED' }),
  { severity: 'medium', category: 'ordering-or-count' });
assert.deepEqual(classify({ field: 'version', code: 'SUMMARY_MATRIX_METADATA_CHANGED' }),
  { severity: 'low', category: 'metadata-or-other' });
assert.throws(() => classify(null), { code: 'INVALID_SUMMARY_COMPARISON_FINDING' });
assert.throws(() => classify({ field: 'x' }), { code: 'INVALID_SUMMARY_COMPARISON_FINDING' });

const clean = severity();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-severity-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.findings, []);
assert.deepEqual(severity(), clean);

const input = fixture();
input.version += 1;
input.simulationAuthorized = true;
input.rows.reverse();
const mixed = input.rows.find(row => row.scenario === 'mixedPriority');
mixed.severityCounts.high += 1;
mixed.priorityFields.push('unexpected');
mixed.categoryNames.reverse();
const comparison = compare(input);
const original = JSON.stringify(comparison);
const result = severity(comparison);
assert.equal(result.hasDrift, true);
assert.equal(result.findingCount, 6);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, { critical: 1, high: 2, medium: 2, low: 1 });
assert.deepEqual(result.findings.map(f => [f.field, f.severity, f.category, f.originalIndex]), [
  ['version', 'low', 'metadata-or-other', 0],
  ['simulationAuthorized', 'critical', 'safety-invariant', 1],
  ['scenarioNames', 'medium', 'ordering-or-count', 2],
  ['severityCounts.high', 'high', 'diagnostic-regression', 3],
  ['categoryNames', 'medium', 'ordering-or-count', 4],
  ['priorityFields', 'high', 'diagnostic-regression', 5]
]);
assert.deepEqual(severity(comparison), result);
assert.equal(JSON.stringify(comparison), original);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) assert.equal(result[flag], false);
result.findings.find(f => f.field === 'categoryNames').actual.push('TAMPER');
assert.equal(JSON.stringify(comparison), original);
assert(!JSON.stringify(severity(comparison)).includes('TAMPER'));

const invalid = { ...comparison, findingCount: 99 };
assert.throws(() => severity(invalid), { code: 'INVALID_SUMMARY_COMPARISON_REPORT' });
assert.throws(() => severity(null), { code: 'INVALID_SUMMARY_COMPARISON_REPORT' });
const invalidFinding = { ...comparison, findings: [{ field: 'x', code: null }], findingCount: 1 };
assert.throws(() => severity(invalidFinding), { code: 'INVALID_SUMMARY_COMPARISON_FINDING' });
console.log('Mission 694 summary comparison severity tests passed.');
