'use strict';

/**
 * Mission 684: independent, manually specified contract inputs.
 * No expected values are generated from the implementation under test.
 */
const assert = require('node:assert/strict');
const { createDiagnosticTriagePrioritySummary } = require('./hlm-diagnostic-triage-priority-summary');

function makeInput() {
  const findings = [
    { scenario: 'a', field: 'meta', code: 'META', severity: 'low', category: 'metadata-or-other', expected: ['old'], actual: ['new'] },
    { scenario: 'b', field: 'safety1', code: 'SAFE', severity: 'critical', category: 'safety-invariant', expected: [false], actual: [true] },
    { scenario: 'c', field: 'count1', code: 'COUNT', severity: 'medium', category: 'ordering-or-count', expected: 1, actual: 2 },
    { scenario: 'd', field: 'diagnostic1', code: 'DIAG', severity: 'high', category: 'diagnostic-regression', expected: ['a'], actual: ['b'] },
    { scenario: 'e', field: 'safety2', code: 'SAFE', severity: 'critical', category: 'safety-invariant', expected: [false], actual: [true] },
    { scenario: 'f', field: 'count2', code: 'COUNT', severity: 'medium', category: 'ordering-or-count', expected: 2, actual: 3 },
    { scenario: 'g', field: 'diagnostic2', code: 'DIAG', severity: 'high', category: 'diagnostic-regression', expected: ['x'], actual: ['y'] }
  ];
  return { kind: 'franchise-diagnostic-triage-drift-severity-report', baselineVersion: 1, findingCount: findings.length, findings };
}

const input = makeInput();
const sourceBefore = JSON.stringify(input);
const result = createDiagnosticTriagePrioritySummary(input);
assert.equal(result.kind, 'franchise-diagnostic-triage-priority-summary');
assert.equal(result.version, 1);
assert.equal(result.baselineVersion, 1);
assert.equal(result.hasDrift, true);
assert.equal(result.findingCount, 7);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, { critical: 2, high: 2, medium: 2, low: 1 });
assert.equal(result.categoryCount, 4);
assert.deepEqual(result.groups.map(group => group.category), [
  'safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'
]);
assert.deepEqual(result.groups.map(group => group.count), [2, 2, 2, 1]);
assert.deepEqual(result.groups.map(group => group.highestSeverity), ['critical', 'high', 'medium', 'low']);
assert.deepEqual(result.groups.map(group => group.counts), [
  { critical: 2, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 2, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 1 }
]);
assert.deepEqual(result.groups.map(group => group.findings.map(f => f.field)), [
  ['safety1', 'safety2'], ['diagnostic1', 'diagnostic2'], ['count1', 'count2'], ['meta']
]);
assert.deepEqual(result.priorityFindings.map(f => f.field), ['safety1', 'safety2']);
assert.deepEqual(result.priorityFindings.map(f => f.originalIndex), [1, 4]);
assert.equal(JSON.stringify(input), sourceBefore, 'contract input must remain untouched');
assert.deepEqual(createDiagnosticTriagePrioritySummary(input), result, 'repeatability');
assert.equal(result.simulationAuthorized, false);
assert.equal(result.sourceStateMutated, false);
assert.equal(result.persistencePerformed, false);

// Mutating a returned group must not affect the input or priority findings.
result.groups[0].findings[0].actual.push('GROUP_TAMPER');
assert.equal(JSON.stringify(input), sourceBefore);
assert(!JSON.stringify(result.priorityFindings).includes('GROUP_TAMPER'));
result.priorityFindings[0].expected.push('PRIORITY_TAMPER');
assert.equal(JSON.stringify(input), sourceBefore);
assert(!JSON.stringify(result.groups).includes('PRIORITY_TAMPER'));
assert(!JSON.stringify(createDiagnosticTriagePrioritySummary(input)).includes('TAMPER'));

// A category can contain mixed severities; priority depends on highest member.
const mixed = makeInput();
mixed.findings[0].category = 'safety-invariant';
const mixedSummary = createDiagnosticTriagePrioritySummary(mixed);
assert.equal(mixedSummary.groups[0].count, 3);
assert.deepEqual(mixedSummary.groups[0].counts, { critical: 2, high: 0, medium: 0, low: 1 });
assert.deepEqual(mixedSummary.groups[0].findings.map(f => f.field), ['safety1', 'safety2', 'meta']);

// Equal-severity categories are alphabetical, while priority findings preserve source order.
const ties = makeInput();
ties.findings[1].category = 'z-safety';
ties.findings[4].category = 'a-safety';
const tied = createDiagnosticTriagePrioritySummary(ties);
assert.deepEqual(tied.groups.slice(0, 2).map(g => g.category), ['a-safety', 'z-safety']);
assert.deepEqual(tied.priorityFindings.map(f => f.field), ['safety1', 'safety2']);

// Independent empty input contract.
const empty = createDiagnosticTriagePrioritySummary({
  kind: input.kind, baselineVersion: 1, findingCount: 0, findings: []
});
assert.deepEqual(empty.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.equal(empty.hasDrift, false);
assert.equal(empty.highestSeverity, null);
assert.equal(empty.categoryCount, 0);
assert.deepEqual(empty.groups, []);
assert.deepEqual(empty.priorityFindings, []);
assert.equal(empty.simulationAuthorized, false);
assert.equal(empty.sourceStateMutated, false);
assert.equal(empty.persistencePerformed, false);

// Reject malformed contracts rather than silently dropping invalid findings.
assert.throws(() => createDiagnosticTriagePrioritySummary(null), { code: 'INVALID_TRIAGE_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePrioritySummary({
  kind: input.kind, findingCount: 2, findings: []
}), { code: 'INVALID_TRIAGE_DRIFT_SEVERITY_REPORT' });
assert.throws(() => createDiagnosticTriagePrioritySummary({
  kind: input.kind, findingCount: 1, findings: [{ field: 'x', code: 'x', category: '', severity: 'critical' }]
}), { code: 'INVALID_TRIAGE_CLASSIFIED_FINDING' });
console.log('Mission 684 independent triage priority contract tests passed.');
