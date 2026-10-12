'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriageFixtureMatrix } = require('./hlm-diagnostic-triage-fixture-matrix');
const { createDiagnosticTriageDriftReport } = require('./hlm-diagnostic-triage-drift-report');
const {
  classifyTriageDriftFinding, createDiagnosticTriageDriftSeverityReport
} = require('./hlm-diagnostic-triage-drift-severity');

const clean = createDiagnosticTriageDriftSeverityReport();
assert.equal(clean.kind, 'franchise-diagnostic-triage-drift-severity-report');
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.findings, []);

const cases = [
  ['simulationAuthorized', 'TRIAGE_SAFETY_INVARIANT_CHANGED', 'critical', 'safety-invariant'],
  ['sourceStateMutated', 'TRIAGE_SAFETY_INVARIANT_CHANGED', 'critical', 'safety-invariant'],
  ['persistencePerformed', 'TRIAGE_SAFETY_INVARIANT_CHANGED', 'critical', 'safety-invariant'],
  ['highestSeverity', 'TRIAGE_BASELINE_CHANGED', 'high', 'diagnostic-regression'],
  ['severityCounts.high', 'TRIAGE_SEVERITY_COUNT_CHANGED', 'high', 'diagnostic-regression'],
  ['priorityFields', 'TRIAGE_PRIORITY_ORDER_CHANGED', 'high', 'diagnostic-regression'],
  ['categoryNames', 'TRIAGE_CATEGORY_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['scenarioNames', 'TRIAGE_SCENARIO_ORDER_CHANGED', 'medium', 'ordering-or-count'],
  ['scenario', 'TRIAGE_SCENARIO_MISSING_OR_DUPLICATED', 'medium', 'ordering-or-count'],
  ['driftCount', 'TRIAGE_BASELINE_CHANGED', 'medium', 'ordering-or-count'],
  ['version', 'TRIAGE_MATRIX_METADATA_CHANGED', 'low', 'metadata-or-other']
];
for (const [field, code, severity, category] of cases) {
  assert.deepEqual(classifyTriageDriftFinding({ field, code }), { severity, category });
}
for (const bad of [null, {}, [], { field: 'version' }, { code: 'x' }]) {
  assert.throws(() => classifyTriageDriftFinding(bad), { code: 'INVALID_TRIAGE_DRIFT_FINDING' });
}

const matrix = createDiagnosticTriageFixtureMatrix();
const changed = JSON.parse(JSON.stringify(matrix));
changed.simulationAuthorized = true;
changed.rows.find(row => row.scenario === 'mixedPriority').highestSeverity = 'high';
changed.rows.find(row => row.scenario === 'mixedPriority').severityCounts.high = 9;
changed.rows.find(row => row.scenario === 'mixedPriority').priorityFields.push('candidateCount');
changed.rows.find(row => row.scenario === 'mixedPriority').categoryNames.reverse();
changed.version = 2;
const drift = createDiagnosticTriageDriftReport(changed);
const before = JSON.stringify(drift);
const report = createDiagnosticTriageDriftSeverityReport(drift);
assert.equal(report.findingCount, 6);
assert.equal(report.hasDrift, true);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 1, high: 3, medium: 1, low: 1 });
assert.deepEqual(report.findings.map(f => f.severity), ['low', 'critical', 'high', 'high', 'medium', 'high']);
assert.deepEqual(report.findings.map(f => f.originalIndex), [0, 1, 2, 3, 4, 5]);
assert.equal(JSON.stringify(drift), before, 'input must remain unchanged');
assert.equal(report.simulationAuthorized, false);
assert.equal(report.sourceStateMutated, false);
assert.equal(report.persistencePerformed, false);
report.findings.find(f => f.field === 'categoryNames').expected.push('TAMPERED');
report.findings.find(f => f.field === 'priorityFields').actual.push('TAMPERED');
assert.equal(JSON.stringify(drift), before, 'nested arrays must be detached');
assert.deepEqual(createDiagnosticTriageDriftSeverityReport(drift).counts, report.counts);
assert.throws(() => createDiagnosticTriageDriftSeverityReport(null), { code: 'INVALID_TRIAGE_DRIFT_REPORT' });
assert.throws(() => createDiagnosticTriageDriftSeverityReport({
  kind: drift.kind, findingCount: 2, findings: []
}), { code: 'INVALID_TRIAGE_DRIFT_REPORT' });
console.log('Mission 682 triage drift severity tests passed.');
