'use strict';
const assert = require('node:assert/strict');
const {
  classifyPriorityBaselineDriftFinding: classify,
  createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftSeverityReport: severity
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');

const cases = [
  ['simulationAuthorized', 'PRIORITY_SAFETY_INVARIANT_CHANGED', 'critical', 'safety-invariant'],
  ['sourceStateMutated', 'OTHER', 'critical', 'safety-invariant'],
  ['persistencePerformed', 'OTHER', 'critical', 'safety-invariant'],
  ['highestSeverity', 'PRIORITY_BASELINE_CHANGED', 'high', 'diagnostic-regression'],
  ['severityCounts.high', 'PRIORITY_SEVERITY_COUNT_CHANGED', 'high', 'diagnostic-regression'],
  ['priorityFields', 'PRIORITY_FIELDS_CHANGED', 'high', 'diagnostic-regression'],
  ['urgentFields', 'PRIORITY_URGENT_FIELDS_CHANGED', 'high', 'diagnostic-regression'],
  ['scenarioNames', 'PRIORITY_SCENARIO_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['categoryNames', 'PRIORITY_CATEGORY_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['findingCount', 'PRIORITY_BASELINE_CHANGED', 'medium', 'ordering-or-count'],
  ['scenario', 'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED', 'medium', 'ordering-or-count'],
  ['version', 'PRIORITY_MATRIX_METADATA_CHANGED', 'low', 'metadata-or-other']
];
for (const [field, code, level, category] of cases) {
  assert.deepEqual(classify({ field, code }), { severity: level, category });
}
assert.throws(() => classify(null), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING' });
assert.throws(() => classify({ field: 3, code: 'OTHER' }), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING' });
assert.throws(() => classify([]), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING' });
assert.throws(() => severity(null), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_REPORT' });
assert.throws(() => severity({ kind: 'wrong', findings: [], findingCount: 0 }),
  { code: 'INVALID_PRIORITY_BASELINE_DRIFT_REPORT' });
assert.throws(() => severity({ kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report',
  findings: [], findingCount: 1 }), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_REPORT' });

const clean = severity();
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
mixed.highestSeverity = 'medium';
mixed.severityCounts.high++;
mixed.categoryNames.reverse();
mixed.urgentFields.push('unexpected');
const drift = compare(input);
const original = JSON.stringify(drift);
const report = severity(drift);
assert.equal(report.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-drift-severity-report');
assert.equal(report.version, 1);
assert.equal(report.baselineVersion, 1);
assert.equal(report.matrixVersion, 2);
assert.equal(report.findingCount, drift.findingCount);
assert.equal(report.hasDrift, true);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 1, high: 3, medium: 2, low: 1 });
assert.deepEqual(report.findings.map(f => f.field), drift.findings.map(f => f.field));
assert.deepEqual(report.findings.map(f => f.originalIndex), report.findings.map((_, i) => i));
assert.deepEqual(report.findings.map(f => f.severity),
  ['low', 'critical', 'medium', 'high', 'high', 'medium', 'high']);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
assert.deepEqual(severity(drift), report);
assert.equal(JSON.stringify(drift), original);
report.findings.find(f => f.field === 'scenarioNames').expected.push('TAMPER');
report.findings.find(f => f.field === 'urgentFields').actual.push('TAMPER');
assert.equal(JSON.stringify(drift), original);
assert(!JSON.stringify(severity(drift)).includes('TAMPER'));
console.log('Mission 700 priority baseline drift severity tests passed.');
