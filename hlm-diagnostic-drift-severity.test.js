'use strict';
const assert = require('node:assert/strict');
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');
const { createFranchiseDiagnosticDriftReport } = require('./hlm-franchise-diagnostic-drift-report');
const { classifyDriftFinding, createDiagnosticDriftSeverityReport, SEVERITY_ORDER } = require('./hlm-diagnostic-drift-severity');

assert.deepEqual(SEVERITY_ORDER, ['critical', 'high', 'medium', 'low']);
assert(Object.isFrozen(SEVERITY_ORDER));
const clean = createDiagnosticDriftSeverityReport();
assert.equal(clean.kind, 'franchise-diagnostic-drift-severity-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.findings, []);
assert.equal(clean.simulationAuthorized, false);
assert.equal(clean.sourceStateMutated, false);
assert.equal(clean.persistencePerformed, false);

const cases = [
  [{ code: 'SIMULATION_AUTHORIZATION_CHANGED', field: 'simulationAuthorized' }, 'critical', 'safety-invariant'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'sourceStateMutated' }, 'critical', 'safety-invariant'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'persistencePerformed' }, 'critical', 'safety-invariant'],
  [{ code: 'REQUIRED_DIAGNOSTIC_MISSING', field: 'errorCodes' }, 'high', 'canonical-diagnostic'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'dataQualityValid' }, 'high', 'data-quality-or-organization'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'unresolvedPlayerCount' }, 'high', 'data-quality-or-organization'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'unresolvedOrganizationWarningCount' }, 'high', 'data-quality-or-organization'],
  [{ code: 'REQUIRED_DIAGNOSTIC_MISSING', field: 'readinessWarningCodes' }, 'high', 'data-quality-or-organization'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'candidateCount' }, 'medium', 'roster-or-fixture'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'teamCount' }, 'medium', 'roster-or-fixture'],
  [{ code: 'FIXTURE_MISSING_OR_DUPLICATED', field: 'fixture' }, 'medium', 'roster-or-fixture'],
  [{ code: 'FIXTURE_ORDER_CHANGED', field: 'fixtureNames' }, 'medium', 'roster-or-fixture'],
  [{ code: 'BASELINE_VALUE_CHANGED', field: 'version' }, 'low', 'metadata-or-other']
];
for (const [change, severity, category] of cases) {
  assert.deepEqual(classifyDriftFinding(change), { severity, category });
}
assert.throws(() => classifyDriftFinding(null), { code: 'INVALID_DRIFT_FINDING' });

const matrix = createFranchiseDiagnosticRegressionMatrix();
matrix.simulationAuthorized = true;
matrix.rows[0].candidateCount = 99;
matrix.rows[1].errorCodes = [];
matrix.rows[2].readinessWarningCodes = [];
matrix.version = 999;
const drift = createFranchiseDiagnosticDriftReport(matrix);
const original = JSON.stringify(drift);
const report = createDiagnosticDriftSeverityReport(drift);
assert.equal(report.findingCount, drift.changeCount);
assert.equal(report.hasDrift, true);
assert.equal(report.highestSeverity, 'critical');
assert(report.counts.critical >= 1);
assert(report.counts.high >= 1);
assert(report.counts.medium >= 1);
assert(report.counts.low >= 1);
assert.equal(Object.values(report.counts).reduce((sum, count) => sum + count, 0), report.findingCount);
assert.equal(report.simulationAuthorized, false);
assert.equal(JSON.stringify(drift), original, 'input drift report must not be mutated');
report.findings[0].field = 'TAMPERED';
assert.equal(createDiagnosticDriftSeverityReport(drift).findings.some(f => f.field === 'TAMPERED'), false);
assert.throws(() => createDiagnosticDriftSeverityReport({}), { code: 'INVALID_DRIFT_REPORT' });
assert.throws(() => createDiagnosticDriftSeverityReport({ kind: 'franchise-diagnostic-drift-report', changes: [], changeCount: 2 }), { code: 'INVALID_DRIFT_REPORT' });
console.log('Mission 676 diagnostic drift severity tests passed.');
