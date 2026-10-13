'use strict';
const assert = require('node:assert/strict');
const {
  classifyPriorityBaselineDriftFinding: classify,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySeverityReport: severity
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport: drift } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');

const cases = [
  ['simulationAuthorized', 'PRIORITY_SAFETY_INVARIANT_CHANGED', 'critical', 'safety-invariant'],
  ['sourceStateMutated', 'anything', 'critical', 'safety-invariant'],
  ['persistencePerformed', 'anything', 'critical', 'safety-invariant'],
  ['highestSeverity', 'PRIORITY_BASELINE_CHANGED', 'high', 'diagnostic-regression'],
  ['severityCounts.low', 'PRIORITY_SEVERITY_COUNT_CHANGED', 'high', 'diagnostic-regression'],
  ['priorityFields', 'PRIORITY_FIELDS_CHANGED', 'high', 'diagnostic-regression'],
  ['urgentFields', 'PRIORITY_URGENT_FIELDS_CHANGED', 'high', 'diagnostic-regression'],
  ['findingCount', 'PRIORITY_BASELINE_CHANGED', 'medium', 'ordering-or-count'],
  ['categoryCount', 'PRIORITY_BASELINE_CHANGED', 'medium', 'ordering-or-count'],
  ['categoryNames', 'PRIORITY_CATEGORY_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['scenarioNames', 'PRIORITY_SCENARIO_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['scenario', 'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED', 'medium', 'ordering-or-count'],
  ['version', 'PRIORITY_MATRIX_METADATA_CHANGED', 'low', 'metadata-or-other']
];
for (const [field, code, level, category] of cases) {
  assert.deepEqual(classify({ field, code }), { severity: level, category });
}
assert.throws(() => classify(null), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING' });
assert.throws(() => classify({ field: 1, code: 'x' }), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING' });
assert.throws(() => classify({ field: 'x', code: null }), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING' });

const empty = severity();
assert.equal(empty.findingCount, 0);
assert.equal(empty.hasDrift, false);
assert.equal(empty.highestSeverity, null);
assert.deepEqual(empty.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(empty.findings, []);
assert.deepEqual(severity(), empty);

const input = fixture();
input.version += 1;
input.simulationAuthorized = true;
input.rows.reverse();
const mixed = input.rows.find(row => row.scenario === 'mixedPriority');
mixed.highestSeverity = 'medium';
mixed.severityCounts.high += 1;
mixed.categoryNames.reverse();
mixed.urgentFields.push('unexpected');
mixed.simulationAuthorized = true;
const driftReport = drift(input);
const snapshot = JSON.stringify(driftReport);
const report = severity(driftReport);
assert.equal(report.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-severity-report');
assert.equal(report.baselineVersion, 1);
assert.equal(report.matrixVersion, 2);
assert.equal(report.findingCount, 8);
assert.deepEqual(report.counts, { critical: 2, high: 3, medium: 2, low: 1 });
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.findings.map(f => f.originalIndex), [0, 1, 2, 3, 4, 5, 6, 7]);
assert.deepEqual(report.findings.map(f => f.severity),
  ['low', 'critical', 'medium', 'high', 'high', 'medium', 'high', 'critical']);
assert.deepEqual(severity(driftReport), report);
assert.equal(JSON.stringify(driftReport), snapshot);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
report.findings.find(f => f.field === 'categoryNames').actual.push('TAMPER');
report.findings.find(f => f.field === 'scenarioNames').expected.push('TAMPER');
report.findings.find(f => f.field === 'urgentFields').actual.push('TAMPER');
assert.equal(JSON.stringify(driftReport), snapshot);
assert(!JSON.stringify(severity(driftReport)).includes('TAMPER'));
assert.throws(() => severity(null), { code: 'INVALID_PRIORITY_BASELINE_DRIFT_REPORT' });
assert.throws(() => severity({ kind: 'wrong', findings: [], findingCount: 0 }),
  { code: 'INVALID_PRIORITY_BASELINE_DRIFT_REPORT' });
assert.throws(() => severity({ ...driftReport, findingCount: 1 }),
  { code: 'INVALID_PRIORITY_BASELINE_DRIFT_REPORT' });
assert.throws(() => severity({ ...driftReport, findings: [null], findingCount: 1 }),
  { code: 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING' });
console.log('Mission 700 priority baseline severity tests passed.');
