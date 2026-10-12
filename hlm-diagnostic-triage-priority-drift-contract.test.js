'use strict';

/**
 * Mission 690: independently authored, pinned contract for Mission 689.
 * Expected values are literal assertions, never derived from the implementation.
 */
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummary } = require('./hlm-diagnostic-triage-priority-drift-summary');

const KIND = 'franchise-diagnostic-triage-priority-drift-severity-report';
function makeInput() {
  const findings = [
    { scenario: 'meta', field: 'version', code: 'META', severity: 'low', category: 'metadata-or-other', expected: ['v1'], actual: ['v2'] },
    { scenario: 'safety', field: 'safetyA', code: 'SAFE', severity: 'critical', category: 'safety-invariant', expected: [false], actual: [true] },
    { scenario: 'count', field: 'countA', code: 'COUNT', severity: 'medium', category: 'ordering-or-count', expected: 1, actual: 2 },
    { scenario: 'diag', field: 'diagnosticA', code: 'DIAG', severity: 'high', category: 'diagnostic-regression', expected: ['a'], actual: ['b'] },
    { scenario: 'safety', field: 'safetyB', code: 'SAFE', severity: 'critical', category: 'safety-invariant', expected: [false], actual: [true] },
    { scenario: 'count', field: 'countB', code: 'COUNT', severity: 'medium', category: 'ordering-or-count', expected: 3, actual: 4 },
    { scenario: 'diag', field: 'diagnosticB', code: 'DIAG', severity: 'high', category: 'diagnostic-regression', expected: ['x'], actual: ['y'] }
  ];
  return { kind: KIND, baselineVersion: 1, matrixVersion: 1, findingCount: 7, findings };
}

const input = makeInput();
const original = JSON.stringify(input);
const result = createDiagnosticTriagePriorityDriftSummary(input);
assert.equal(result.kind, 'franchise-diagnostic-triage-priority-drift-summary');
assert.equal(result.version, 1);
assert.equal(result.baselineVersion, 1);
assert.equal(result.matrixVersion, 1);
assert.equal(result.hasDrift, true);
assert.equal(result.findingCount, 7);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, { critical: 2, high: 2, medium: 2, low: 1 });
assert.equal(result.categoryCount, 4);
assert.deepEqual(result.groups.map(g => g.category), [
  'safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'
]);
assert.deepEqual(result.groups.map(g => [g.count, g.highestSeverity]), [
  [2, 'critical'], [2, 'high'], [2, 'medium'], [1, 'low']
]);
assert.deepEqual(result.groups.map(g => g.counts), [
  { critical: 2, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 2, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 1 }
]);
assert.deepEqual(result.groups.map(g => g.findings.map(f => f.field)), [
  ['safetyA', 'safetyB'], ['diagnosticA', 'diagnosticB'],
  ['countA', 'countB'], ['version']
]);
assert.deepEqual(result.groups.map(g => g.findings.map(f => f.originalIndex)), [
  [1, 4], [3, 6], [2, 5], [0]
]);
assert.deepEqual(result.priorityFindings.map(f => f.field), ['safetyA', 'safetyB']);
assert.deepEqual(result.priorityFindings.map(f => f.originalIndex), [1, 4]);
assert.equal(JSON.stringify(input), original, 'source must be unchanged');
assert.deepEqual(createDiagnosticTriagePriorityDriftSummary(input), result, 'repeatability');
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}

result.groups[0].findings[0].actual.push('GROUP_TAMPER');
assert(!JSON.stringify(result.priorityFindings).includes('GROUP_TAMPER'));
result.priorityFindings[0].expected.push('PRIORITY_TAMPER');
assert(!JSON.stringify(result.groups).includes('PRIORITY_TAMPER'));
assert.equal(JSON.stringify(input), original);
assert(!JSON.stringify(createDiagnosticTriagePriorityDriftSummary(input)).includes('TAMPER'));

// Mixed-severity categories retain their highest severity and sort findings within group.
const mixed = makeInput();
mixed.findings[0].category = 'safety-invariant';
const mixedSummary = createDiagnosticTriagePriorityDriftSummary(mixed);
assert.equal(mixedSummary.groups[0].count, 3);
assert.deepEqual(mixedSummary.groups[0].counts, { critical: 2, high: 0, medium: 0, low: 1 });
assert.deepEqual(mixedSummary.groups[0].findings.map(f => f.field), ['safetyA', 'safetyB', 'version']);

// Equal-severity categories sort alphabetically, while highest-priority findings keep input order.
const ties = makeInput();
ties.findings[1].category = 'z-critical';
ties.findings[4].category = 'a-critical';
const tied = createDiagnosticTriagePriorityDriftSummary(ties);
assert.deepEqual(tied.groups.slice(0, 2).map(g => g.category), ['a-critical', 'z-critical']);
assert.deepEqual(tied.priorityFindings.map(f => f.field), ['safetyA', 'safetyB']);

const empty = createDiagnosticTriagePriorityDriftSummary({
  kind: KIND, baselineVersion: 1, matrixVersion: 1, findingCount: 0, findings: []
});
assert.equal(empty.hasDrift, false);
assert.equal(empty.highestSeverity, null);
assert.equal(empty.findingCount, 0);
assert.equal(empty.categoryCount, 0);
assert.deepEqual(empty.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(empty.groups, []);
assert.deepEqual(empty.priorityFindings, []);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(empty[flag], false);
}

assert.throws(() => createDiagnosticTriagePriorityDriftSummary(null),
  { code: 'INVALID_PRIORITY_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePriorityDriftSummary({ kind: KIND, findingCount: 2, findings: [] }),
  { code: 'INVALID_PRIORITY_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePriorityDriftSummary({
  kind: KIND, findingCount: 1, findings: [{ field: 'x', code: 'x', severity: 'invalid', category: 'a' }]
}), { code: 'INVALID_PRIORITY_CLASSIFIED_FINDING' });
assert.throws(() => createDiagnosticTriagePriorityDriftSummary({
  kind: KIND, findingCount: 1, findings: [{ field: 'x', code: 'x', severity: 'critical', category: '' }]
}), { code: 'INVALID_PRIORITY_CLASSIFIED_FINDING' });
console.log('Mission 690 independent priority drift summary contract tests passed.');
