'use strict';

/**
 * Mission 702: independent synthetic contract tests for Mission 701.
 * No runtime fixture generator, comparison pipeline or Mission 700 classifier.
 */
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummary: summarize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary');

const KIND = 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-severity-report';
const COUNTS = (critical, high, medium, low) => ({ critical, high, medium, low });
const make = (findings, overrides = {}) => ({
  kind: KIND, baselineVersion: 17, matrixVersion: 23,
  findingCount: findings.length, findings, ...overrides
});
const item = (field, severity, category, index) => ({
  scenario: 'fictional-' + index, field, code: 'SYNTHETIC_' + index,
  severity, category, expected: ['expected-' + index], actual: ['actual-' + index],
  originalIndex: 900 + index
});

const synthetic = make([
  item('low-a', 'low', 'meta-z', 0),
  item('high-a', 'high', 'shared', 1),
  item('medium-a', 'medium', 'order-b', 2),
  item('critical-a', 'critical', 'safety', 3),
  item('high-b', 'high', 'shared', 4),
  item('medium-b', 'medium', 'order-a', 5),
  item('critical-b', 'critical', 'shared', 6),
  item('high-c', 'high', 'diagnostic', 7),
  item('low-b', 'low', 'meta-z', 8)
]);
const before = JSON.stringify(synthetic);
const result = summarize(synthetic);
assert.equal(result.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary');
assert.equal(result.version, 1);
assert.equal(result.baselineVersion, 17);
assert.equal(result.matrixVersion, 23);
assert.equal(result.findingCount, 9);
assert.equal(result.hasDrift, true);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, COUNTS(2, 3, 2, 2));
assert.equal(result.categoryCount, 6);
assert.deepEqual(result.groups.map(g => g.category),
  ['safety', 'shared', 'diagnostic', 'order-a', 'order-b', 'meta-z']);
assert.deepEqual(result.groups.map(g => g.count), [1, 3, 1, 1, 1, 2]);
assert.deepEqual(result.groups.map(g => g.highestSeverity),
  ['critical', 'critical', 'high', 'medium', 'medium', 'low']);
assert.deepEqual(result.groups.map(g => g.counts), [
  COUNTS(1, 0, 0, 0), COUNTS(1, 2, 0, 0), COUNTS(0, 1, 0, 0),
  COUNTS(0, 0, 1, 0), COUNTS(0, 0, 1, 0), COUNTS(0, 0, 0, 2)
]);
assert.deepEqual(result.groups[1].findings.map(f => f.field),
  ['critical-b', 'high-a', 'high-b']);
assert.deepEqual(result.groups[5].findings.map(f => f.field), ['low-a', 'low-b']);
assert.deepEqual(result.priorityFindings.map(f => f.field), ['critical-a', 'critical-b']);
assert.deepEqual(result.urgentFindings.map(f => f.field),
  ['critical-a', 'critical-b', 'high-a', 'high-b', 'high-c']);
assert.deepEqual(result.urgentFindings.map(f => f.originalIndex), [3, 6, 1, 4, 7]);
assert.deepEqual(result.groups[1].findings.map(f => f.originalIndex), [6, 1, 4]);
assert.deepEqual(summarize(synthetic), result);
assert.equal(JSON.stringify(synthetic), before);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.groups[1].findings[0].actual.push('TAMPER');
result.urgentFindings[0].actual.push('TAMPER');
result.priorityFindings[0].expected.push('TAMPER');
result.counts.critical = 100;
result.groups[0].counts.critical = 100;
assert.equal(JSON.stringify(synthetic), before);
assert(!JSON.stringify(summarize(synthetic)).includes('TAMPER'));

const empty = summarize(make([]));
assert.equal(empty.findingCount, 0);
assert.equal(empty.hasDrift, false);
assert.equal(empty.highestSeverity, null);
assert.deepEqual(empty.counts, COUNTS(0, 0, 0, 0));
assert.equal(empty.categoryCount, 0);
assert.deepEqual(empty.groups, []);
assert.deepEqual(empty.priorityFindings, []);
assert.deepEqual(empty.urgentFindings, []);
const highOnly = summarize(make([item('high-only', 'high', 'diagnostic', 1)]));
assert.equal(highOnly.highestSeverity, 'high');
assert.deepEqual(highOnly.counts, COUNTS(0, 1, 0, 0));
assert.deepEqual(highOnly.priorityFindings.map(f => f.field), ['high-only']);
assert.deepEqual(highOnly.urgentFindings.map(f => f.field), ['high-only']);
const mediumOnly = summarize(make([item('medium-only', 'medium', 'ordering', 1)]));
assert.equal(mediumOnly.highestSeverity, 'medium');
assert.equal(mediumOnly.priorityFindings.length, 1);
assert.deepEqual(mediumOnly.urgentFindings, []);
const lowOnly = summarize(make([item('low-only', 'low', 'metadata', 1)]));
assert.equal(lowOnly.highestSeverity, 'low');
assert.equal(lowOnly.priorityFindings.length, 1);
assert.deepEqual(lowOnly.urgentFindings, []);

for (const bad of [null, {}, { ...make([]), kind: 'wrong' },
  { ...make([]), findings: null }, { ...make([]), findingCount: 1 }]) {
  assert.throws(() => summarize(bad), { code: 'INVALID_PRIORITY_BASELINE_SEVERITY_REPORT' });
}
for (const bad of [null, [], { field: 'x', code: 'X', category: 'x', severity: 'unknown' },
  { field: 'x', code: 'X', category: '', severity: 'high' },
  { field: 'x', code: 'X', category: '   ', severity: 'high' },
  { field: 123, code: 'X', category: 'x', severity: 'high' },
  { field: 'x', code: null, category: 'x', severity: 'high' }]) {
  assert.throws(() => summarize(make([bad])),
    { code: 'INVALID_PRIORITY_BASELINE_CLASSIFIED_FINDING' });
}
console.log('Mission 702 independent synthetic priority summary contract tests passed.');
