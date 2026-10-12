'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriageFixtureMatrix } = require('./hlm-diagnostic-triage-fixture-matrix');
const { createDiagnosticTriageDriftReport } = require('./hlm-diagnostic-triage-drift-report');
const { createDiagnosticTriageDriftSeverityReport } = require('./hlm-diagnostic-triage-drift-severity');
const { createDiagnosticTriagePrioritySummary } = require('./hlm-diagnostic-triage-priority-summary');

const clean = createDiagnosticTriagePrioritySummary();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-summary');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.equal(clean.categoryCount, 0);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.groups, []);
assert.deepEqual(clean.priorityFindings, []);
assert.equal(clean.simulationAuthorized, false);
assert.equal(clean.sourceStateMutated, false);
assert.equal(clean.persistencePerformed, false);

const changed = createDiagnosticTriageFixtureMatrix();
changed.simulationAuthorized = true;
const mixed = changed.rows.find(row => row.scenario === 'mixedPriority');
mixed.highestSeverity = 'high';
mixed.severityCounts.high = 9;
mixed.priorityFields.push('candidateCount');
mixed.categoryNames.reverse();
changed.version = 2;
const severity = createDiagnosticTriageDriftSeverityReport(createDiagnosticTriageDriftReport(changed));
const before = JSON.stringify(severity);
const report = createDiagnosticTriagePrioritySummary(severity);
assert.equal(report.findingCount, 6);
assert.equal(report.hasDrift, true);
assert.equal(report.highestSeverity, 'critical');
assert.equal(report.categoryCount, 4);
assert.deepEqual(report.counts, { critical: 1, high: 3, medium: 1, low: 1 });
assert.deepEqual(report.groups.map(group => group.category), [
  'safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'
]);
assert.deepEqual(report.groups.map(group => group.count), [1, 3, 1, 1]);
assert.deepEqual(report.groups.map(group => group.highestSeverity), ['critical', 'high', 'medium', 'low']);
assert.deepEqual(report.groups[1].findings.map(finding => finding.field), [
  'highestSeverity', 'severityCounts.high', 'priorityFields'
]);
assert.deepEqual(report.priorityFindings.map(finding => finding.field), ['simulationAuthorized']);
assert.deepEqual(report.priorityFindings.map(finding => finding.severity), ['critical']);
assert.equal(JSON.stringify(severity), before, 'source report unchanged');
assert.equal(report.simulationAuthorized, false);
assert.equal(report.sourceStateMutated, false);
assert.equal(report.persistencePerformed, false);

const priority = report.priorityFindings[0];
assert.equal(priority.originalIndex, 1);
report.groups[1].findings.find(finding => finding.field === 'priorityFields').actual.push('TAMPERED');
assert.equal(JSON.stringify(severity), before, 'group finding arrays detached from input');
assert(!report.priorityFindings.some(finding => JSON.stringify(finding).includes('TAMPERED')));
const fresh = createDiagnosticTriagePrioritySummary(severity);
assert(!JSON.stringify(fresh).includes('TAMPERED'));
assert.deepEqual(fresh, createDiagnosticTriagePrioritySummary(severity), 'deterministic output');

const highOnly = {
  kind: 'franchise-diagnostic-triage-drift-severity-report',
  baselineVersion: 1,
  findingCount: 2,
  findings: [
    { scenario: 'clean', field: 'highestSeverity', code: 'X', severity: 'high', category: 'z-category' },
    { scenario: 'clean', field: 'priorityFields', code: 'X', severity: 'high', category: 'a-category' }
  ]
};
const tie = createDiagnosticTriagePrioritySummary(highOnly);
assert.deepEqual(tie.groups.map(group => group.category), ['a-category', 'z-category']);
assert.deepEqual(tie.priorityFindings.map(finding => finding.field), ['highestSeverity', 'priorityFields']);

assert.throws(() => createDiagnosticTriagePrioritySummary(null), { code: 'INVALID_TRIAGE_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePrioritySummary({
  kind: highOnly.kind, findingCount: 3, findings: highOnly.findings
}), { code: 'INVALID_TRIAGE_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePrioritySummary({
  kind: highOnly.kind, findingCount: 1, findings: [{ severity: 'unknown', category: 'x', field: 'x', code: 'x' }]
}), { code: 'INVALID_TRIAGE_CLASSIFIED_FINDING' });
console.log('Mission 683 triage priority summary tests passed.');
