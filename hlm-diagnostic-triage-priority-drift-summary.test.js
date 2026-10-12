'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityFixtureMatrix } = require('./hlm-diagnostic-triage-priority-fixture-matrix');
const { createDiagnosticTriagePriorityDriftReport } = require('./hlm-diagnostic-triage-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSeverityReport } = require('./hlm-diagnostic-triage-priority-drift-severity');
const { createDiagnosticTriagePriorityDriftSummary } = require('./hlm-diagnostic-triage-priority-drift-summary');

const clean = createDiagnosticTriagePriorityDriftSummary();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.equal(clean.categoryCount, 0);
assert.deepEqual(clean.groups, []);
assert.deepEqual(clean.priorityFindings, []);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(clean[flag], false);
}

const matrix = createDiagnosticTriagePriorityFixtureMatrix();
matrix.simulationAuthorized = true;
matrix.version += 1;
const regression = matrix.rows.find(row => row.scenario === 'diagnosticRegression');
regression.highestSeverity = 'critical';
regression.severityCounts.high += 1;
regression.priorityFields.push('new-priority');
const ordering = matrix.rows.find(row => row.scenario === 'orderingChange');
ordering.categoryNames.push('extra-category');
ordering.findingCount += 1;
const matrixBefore = JSON.stringify(matrix);
const drift = createDiagnosticTriagePriorityDriftReport(matrix);
const severity = createDiagnosticTriagePriorityDriftSeverityReport(drift);
const severityBefore = JSON.stringify(severity);
const summary = createDiagnosticTriagePriorityDriftSummary(severity);
assert.equal(summary.hasDrift, true);
assert.equal(summary.findingCount, 7);
assert.equal(summary.highestSeverity, 'critical');
assert.deepEqual(summary.counts, { critical: 1, high: 3, medium: 2, low: 1 });
assert.equal(summary.categoryCount, 4);
assert.deepEqual(summary.groups.map(g => [g.category, g.count, g.highestSeverity]), [
  ['safety-invariant', 1, 'critical'],
  ['diagnostic-regression', 3, 'high'],
  ['ordering-or-count', 2, 'medium'],
  ['metadata-or-other', 1, 'low']
]);
assert.deepEqual(summary.groups.map(g => g.findings.map(f => f.field)), [
  ['simulationAuthorized'],
  ['highestSeverity', 'severityCounts.high', 'priorityFields'],
  ['findingCount', 'categoryNames'],
  ['version']
]);
assert.deepEqual(summary.priorityFindings.map(f => f.field), ['simulationAuthorized']);
assert.deepEqual(summary.priorityFindings.map(f => f.originalIndex), [1]);
assert.equal(JSON.stringify(matrix), matrixBefore);
assert.equal(JSON.stringify(severity), severityBefore);
assert.deepEqual(createDiagnosticTriagePriorityDriftSummary(severity), summary, 'deterministic output');
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(summary[flag], false);
}
summary.groups[1].findings[2].actual.push('TAMPER');
summary.priorityFindings[0].field = 'TAMPER';
assert.equal(JSON.stringify(severity), severityBefore);
assert(!JSON.stringify(createDiagnosticTriagePriorityDriftSummary(severity)).includes('TAMPER'));

const tie = {
  kind: 'franchise-diagnostic-triage-priority-drift-severity-report',
  baselineVersion: 1, matrixVersion: 1, findingCount: 4,
  findings: [
    { scenario: 's', field: 'a', code: 'x', severity: 'high', category: 'zeta', expected: [], actual: [] },
    { scenario: 's', field: 'b', code: 'x', severity: 'high', category: 'alpha', expected: [], actual: [] },
    { scenario: 's', field: 'c', code: 'x', severity: 'medium', category: 'alpha', expected: [], actual: [] },
    { scenario: 's', field: 'd', code: 'x', severity: 'high', category: 'zeta', expected: [], actual: [] }
  ]
};
const tied = createDiagnosticTriagePriorityDriftSummary(tie);
assert.deepEqual(tied.groups.map(g => g.category), ['alpha', 'zeta']);
assert.deepEqual(tied.groups[1].findings.map(f => f.field), ['a', 'd']);
assert.deepEqual(tied.priorityFindings.map(f => f.field), ['a', 'b', 'd']);
assert.deepEqual(tied.groups[0].counts, { critical: 0, high: 1, medium: 1, low: 0 });
assert.throws(() => createDiagnosticTriagePriorityDriftSummary(null),
  { code: 'INVALID_PRIORITY_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePriorityDriftSummary({
  kind: tie.kind, findingCount: 2, findings: []
}), { code: 'INVALID_PRIORITY_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePriorityDriftSummary({
  kind: tie.kind, findingCount: 1, findings: [{ field: 'x', code: 'x', severity: 'invalid', category: 'x' }]
}), { code: 'INVALID_PRIORITY_CLASSIFIED_FINDING' });
console.log('Mission 689 grouped priority drift summary tests passed.');
