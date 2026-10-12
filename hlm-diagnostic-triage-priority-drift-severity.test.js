'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityFixtureMatrix } = require('./hlm-diagnostic-triage-priority-fixture-matrix');
const { createDiagnosticTriagePriorityDriftReport } = require('./hlm-diagnostic-triage-priority-drift-report');
const {
  classifyPriorityDriftFinding, createDiagnosticTriagePriorityDriftSeverityReport
} = require('./hlm-diagnostic-triage-priority-drift-severity');

const clean = createDiagnosticTriagePriorityDriftSeverityReport();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-severity-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.findings, []);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(clean[flag], false);
}

const cases = [
  ['simulationAuthorized', 'PRIORITY_SAFETY_INVARIANT_CHANGED', 'critical', 'safety-invariant'],
  ['sourceStateMutated', 'PRIORITY_BASELINE_CHANGED', 'critical', 'safety-invariant'],
  ['persistencePerformed', 'PRIORITY_BASELINE_CHANGED', 'critical', 'safety-invariant'],
  ['highestSeverity', 'PRIORITY_BASELINE_CHANGED', 'high', 'diagnostic-regression'],
  ['severityCounts.high', 'PRIORITY_SEVERITY_COUNT_CHANGED', 'high', 'diagnostic-regression'],
  ['priorityFields', 'PRIORITY_FIELD_ORDER_CHANGED', 'high', 'diagnostic-regression'],
  ['categoryNames', 'PRIORITY_CATEGORY_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['scenarioNames', 'PRIORITY_SCENARIO_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['scenario', 'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED', 'medium', 'ordering-or-count'],
  ['findingCount', 'PRIORITY_BASELINE_CHANGED', 'medium', 'ordering-or-count'],
  ['version', 'PRIORITY_MATRIX_METADATA_CHANGED', 'low', 'metadata-or-other']
];
for (const [field, code, severity, category] of cases) {
  assert.deepEqual(classifyPriorityDriftFinding({ field, code }), { severity, category });
}
assert.throws(() => classifyPriorityDriftFinding(null), { code: 'INVALID_PRIORITY_DRIFT_FINDING' });
assert.throws(() => classifyPriorityDriftFinding({ field: 4, code: 'x' }), { code: 'INVALID_PRIORITY_DRIFT_FINDING' });

const matrix = createDiagnosticTriagePriorityFixtureMatrix();
matrix.simulationAuthorized = true;
matrix.version += 1;
const regression = matrix.rows.find(row => row.scenario === 'diagnosticRegression');
regression.highestSeverity = 'critical';
regression.severityCounts.high += 1;
regression.priorityFields.push('unexpected');
const ordering = matrix.rows.find(row => row.scenario === 'orderingChange');
ordering.categoryNames.push('unexpected');
ordering.findingCount += 1;
const before = JSON.stringify(matrix);
const drift = createDiagnosticTriagePriorityDriftReport(matrix);
const driftBefore = JSON.stringify(drift);
const report = createDiagnosticTriagePriorityDriftSeverityReport(drift);
assert.equal(report.findingCount, 7);
assert.equal(report.hasDrift, true);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 1, high: 3, medium: 2, low: 1 });
assert.deepEqual(report.findings.map(f => [f.field, f.severity, f.originalIndex]), [
  ['version', 'low', 0],
  ['simulationAuthorized', 'critical', 1],
  ['highestSeverity', 'high', 2],
  ['severityCounts.high', 'high', 3],
  ['priorityFields', 'high', 4],
  ['findingCount', 'medium', 5],
  ['categoryNames', 'medium', 6]
]);
assert.deepEqual(createDiagnosticTriagePriorityDriftSeverityReport(drift), report);
assert.equal(JSON.stringify(matrix), before);
assert.equal(JSON.stringify(drift), driftBefore);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
report.findings[4].actual.push('TAMPER');
assert.equal(JSON.stringify(drift), driftBefore);
assert(!JSON.stringify(createDiagnosticTriagePriorityDriftSeverityReport(drift)).includes('TAMPER'));
assert.throws(() => createDiagnosticTriagePriorityDriftSeverityReport(null),
  { code: 'INVALID_PRIORITY_DRIFT_REPORT' });
assert.throws(() => createDiagnosticTriagePriorityDriftSeverityReport({
  kind: 'franchise-diagnostic-triage-priority-drift-report', findingCount: 1, findings: []
}), { code: 'INVALID_PRIORITY_DRIFT_REPORT' });
assert.throws(() => createDiagnosticTriagePriorityDriftSeverityReport({
  kind: 'franchise-diagnostic-triage-priority-drift-report', findingCount: 1,
  findings: [{ field: null, code: 'x' }]
}), { code: 'INVALID_PRIORITY_DRIFT_FINDING' });
console.log('Mission 688 priority drift severity tests passed.');
