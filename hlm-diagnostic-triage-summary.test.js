'use strict';
const assert = require('node:assert/strict');
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');
const { createFranchiseDiagnosticDriftReport } = require('./hlm-franchise-diagnostic-drift-report');
const { createDiagnosticDriftSeverityReport } = require('./hlm-diagnostic-drift-severity');
const { createDiagnosticTriageSummary } = require('./hlm-diagnostic-triage-summary');

const clean = createDiagnosticTriageSummary();
assert.equal(clean.kind, 'franchise-diagnostic-triage-summary');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.equal(clean.categoryCount, 0);
assert.deepEqual(clean.groups, []);
assert.deepEqual(clean.priorityFindings, []);
assert.equal(clean.simulationAuthorized, false);
assert.equal(clean.sourceStateMutated, false);
assert.equal(clean.persistencePerformed, false);

const matrix = createFranchiseDiagnosticRegressionMatrix();
matrix.simulationAuthorized = true;
matrix.rows[0].candidateCount = 7;
matrix.rows[1].errorCodes = [];
matrix.rows[2].readinessWarningCodes = [];
matrix.version = 2;
const severity = createDiagnosticDriftSeverityReport(createFranchiseDiagnosticDriftReport(matrix));
const original = JSON.stringify(severity);
const triage = createDiagnosticTriageSummary(severity);
assert.equal(triage.findingCount, severity.findingCount);
assert.equal(triage.categoryCount, triage.groups.length);
assert.equal(triage.highestSeverity, 'critical');
assert(triage.counts.critical > 0);
assert(triage.counts.high > 0);
assert(triage.counts.medium > 0);
assert(triage.counts.low > 0);
assert.equal(triage.priorityFindings.length, triage.counts.critical);
assert(triage.priorityFindings.every(finding => finding.severity === 'critical'));
assert.equal(triage.groups.reduce((sum, group) => sum + group.count, 0), triage.findingCount);
assert.equal(Object.values(triage.counts).reduce((sum, count) => sum + count, 0), triage.findingCount);
for (const group of triage.groups) {
  assert.equal(group.findings.length, group.count);
  assert.equal(Object.values(group.counts).reduce((sum, count) => sum + count, 0), group.count);
  assert(group.findings.every(finding => finding.category === group.category));
}
assert.equal(JSON.stringify(severity), original, 'severity input must not be mutated');
assert.equal(triage.simulationAuthorized, false);

const order = { critical: 0, high: 1, medium: 2, low: 3 };
const all = triage.groups.flatMap(group => group.findings);
assert(all.every(finding => order[finding.severity] >= 0));
assert(triage.groups.every((group, i) => i === 0 || order[triage.groups[i - 1].highestSeverity] <= order[group.highestSeverity]));

triage.groups[0].findings[0].field = 'TAMPERED';
triage.priorityFindings[0].field = 'TAMPERED';
const fresh = createDiagnosticTriageSummary(severity);
assert(!fresh.groups.some(group => group.findings.some(finding => finding.field === 'TAMPERED')));
assert(!fresh.priorityFindings.some(finding => finding.field === 'TAMPERED'));
assert.equal(JSON.stringify(severity), original);

assert.throws(() => createDiagnosticTriageSummary(null), { code: 'INVALID_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriageSummary({}), { code: 'INVALID_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriageSummary({
  kind: 'franchise-diagnostic-drift-severity-report', findings: [{}], findingCount: 1
}), { code: 'INVALID_CLASSIFIED_FINDING' });
console.log('Mission 677 diagnostic triage summary tests passed.');
