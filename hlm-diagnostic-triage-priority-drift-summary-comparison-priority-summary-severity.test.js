'use strict';
const assert = require('node:assert/strict');
const {
  classifyPrioritySummaryDriftFinding: classify,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummarySeverityReport: severity
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-drift-report');

const clean = severity();
assert.equal(clean.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-severity-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.findings, []);
assert.deepEqual(severity(), clean);
const cases = [
  ['simulationAuthorized', 'PRIORITY_SUMMARY_SAFETY_INVARIANT_CHANGED', 'critical', 'safety-invariant'],
  ['sourceStateMutated', 'OTHER', 'critical', 'safety-invariant'],
  ['persistencePerformed', 'OTHER', 'critical', 'safety-invariant'],
  ['highestSeverity', 'PRIORITY_SUMMARY_BASELINE_CHANGED', 'high', 'diagnostic-regression'],
  ['severityCounts.high', 'OTHER', 'high', 'diagnostic-regression'],
  ['priorityFields', 'OTHER', 'high', 'diagnostic-regression'],
  ['urgentFields', 'OTHER', 'high', 'diagnostic-regression'],
  ['other', 'PRIORITY_SUMMARY_SEVERITY_COUNT_CHANGED', 'high', 'diagnostic-regression'],
  ['other', 'PRIORITY_SUMMARY_PRIORITY_FIELDS_CHANGED', 'high', 'diagnostic-regression'],
  ['other', 'PRIORITY_SUMMARY_URGENT_FIELDS_CHANGED', 'high', 'diagnostic-regression'],
  ['hasDrift', 'OTHER', 'medium', 'ordering-or-count'],
  ['findingCount', 'OTHER', 'medium', 'ordering-or-count'],
  ['categoryCount', 'OTHER', 'medium', 'ordering-or-count'],
  ['categoryNames', 'OTHER', 'medium', 'ordering-or-count'],
  ['scenarioCount', 'OTHER', 'medium', 'ordering-or-count'],
  ['scenarioNames', 'OTHER', 'medium', 'ordering-or-count'],
  ['scenario', 'OTHER', 'medium', 'ordering-or-count'],
  ['other', 'PRIORITY_SUMMARY_CATEGORY_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['other', 'PRIORITY_SUMMARY_SCENARIO_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['other', 'PRIORITY_SUMMARY_SCENARIO_MISSING_OR_DUPLICATED', 'medium', 'ordering-or-count'],
  ['version', 'PRIORITY_SUMMARY_MATRIX_METADATA_CHANGED', 'low', 'metadata-or-other'],
  ['kind', 'OTHER', 'low', 'metadata-or-other']
];
for (const [field, code, expectedSeverity, category] of cases) {
  assert.deepEqual(classify({ field, code }), { severity: expectedSeverity, category });
}
const matrix = fixture();
matrix.version = 2;
matrix.simulationAuthorized = true;
matrix.rows.reverse();
const row = matrix.rows.find(item => item.scenario === 'mixedPriority');
row.highestSeverity = 'low';
row.severityCounts.high++;
row.categoryNames.reverse();
row.priorityFields.push('extra');
row.urgentFields.push('extra');
const drift = compare(matrix);
const before = JSON.stringify(drift);
const report = severity(drift);
assert.equal(report.hasDrift, true);
assert.equal(report.findingCount, 8);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 1, high: 4, medium: 2, low: 1 });
assert.deepEqual(report.findings.map(f => f.severity),
  ['low', 'critical', 'medium', 'high', 'high', 'high', 'medium', 'high']);
assert.deepEqual(report.findings.map(f => f.originalIndex), [0, 1, 2, 3, 4, 5, 6, 7]);
assert.equal(report.findingCount, report.findings.length);
assert.equal(JSON.stringify(drift), before);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
report.findings[2].actual.push('TAMPER');
report.findings[6].expected.push('TAMPER');
report.counts.high = 999;
assert.equal(JSON.stringify(drift), before);
assert(!JSON.stringify(severity(drift)).includes('TAMPER'));
assert.deepEqual(severity(drift).counts, { critical: 1, high: 4, medium: 2, low: 1 });
for (const invalid of [null, [], {}, { kind: 'wrong', findings: [], findingCount: 0 },
  { ...compare(), findings: null }, { ...compare(), findingCount: 1 }]) {
  assert.throws(() => severity(invalid), { code: 'INVALID_PRIORITY_SUMMARY_DRIFT_REPORT' });
}
for (const invalid of [null, [], { field: 4, code: 'X' }, { field: 'x', code: null }]) {
  assert.throws(() => classify(invalid), { code: 'INVALID_PRIORITY_SUMMARY_DRIFT_FINDING' });
}
const invalidFinding = { ...compare(), findings: [{ field: null, code: 'OTHER' }], findingCount: 1 };
assert.throws(() => severity(invalidFinding), { code: 'INVALID_PRIORITY_SUMMARY_DRIFT_FINDING' });
console.log('Mission 706 priority summary severity tests passed.');
