'use strict';

/**
 * Mission 696: independently pinned synthetic contract tests for Mission 695.
 * Deliberately does not import Mission 691 fixtures or the Mission 693/694 pipeline.
 */
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityReport: prioritize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority');

const KIND = 'franchise-diagnostic-triage-priority-drift-summary-comparison-severity-report';
const make = (findings, extra = {}) => ({
  kind: KIND, version: 1, baselineVersion: 7, matrixVersion: 9,
  findingCount: findings.length, findings, ...extra
});
const finding = (field, severity, category, expected = [], actual = []) => ({
  scenario: 'synthetic', field, code: 'SYNTHETIC_CONTRACT',
  severity, category, expected, actual
});
const zero = { critical: 0, high: 0, medium: 0, low: 0 };
const empty = prioritize(make([]));
assert.equal(empty.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-report');
assert.equal(empty.version, 1);
assert.equal(empty.baselineVersion, 7);
assert.equal(empty.matrixVersion, 9);
assert.equal(empty.hasDrift, false);
assert.equal(empty.findingCount, 0);
assert.equal(empty.highestSeverity, null);
assert.deepEqual(empty.counts, zero);
assert.equal(empty.categoryCount, 0);
assert.deepEqual(empty.groups, []);
assert.deepEqual(empty.priorityFindings, []);
assert.deepEqual(empty.urgentFindings, []);

const synthetic = [
  finding('low-one', 'low', 'metadata-or-other', ['a'], ['b']),
  finding('medium-first', 'medium', 'ordering-or-count'),
  finding('high-first', 'high', 'diagnostic-regression', ['before'], ['after']),
  finding('critical-first', 'critical', 'safety-invariant'),
  finding('high-second', 'high', 'diagnostic-regression'),
  finding('critical-second', 'critical', 'safety-invariant'),
  finding('medium-second', 'medium', 'ordering-or-count'),
  finding('high-other', 'high', 'secondary-regression'),
  finding('low-two', 'low', 'metadata-or-other')
];
const source = make(synthetic);
const sourceSnapshot = JSON.stringify(source);
const report = prioritize(source);
assert.equal(report.hasDrift, true);
assert.equal(report.findingCount, 9);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 2, high: 3, medium: 2, low: 2 });
assert.equal(report.categoryCount, 5);
assert.deepEqual(report.groups.map(g => g.category),
  ['safety-invariant', 'diagnostic-regression', 'secondary-regression',
    'ordering-or-count', 'metadata-or-other']);
assert.deepEqual(report.groups.map(g => g.count), [2, 2, 1, 2, 2]);
assert.deepEqual(report.groups.map(g => g.highestSeverity),
  ['critical', 'high', 'high', 'medium', 'low']);
assert.deepEqual(report.groups.map(g => g.counts), [
  { critical: 2, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 2, medium: 0, low: 0 },
  { critical: 0, high: 1, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 2 }
]);
assert.deepEqual(report.groups.map(g => g.findings.map(f => f.field)), [
  ['critical-first', 'critical-second'],
  ['high-first', 'high-second'],
  ['high-other'],
  ['medium-first', 'medium-second'],
  ['low-one', 'low-two']
]);
assert.deepEqual(report.priorityFindings.map(f => f.field),
  ['critical-first', 'critical-second']);
assert.deepEqual(report.urgentFindings.map(f => f.field),
  ['critical-first', 'critical-second', 'high-first', 'high-second', 'high-other']);
assert.deepEqual(report.urgentFindings.map(f => f.originalIndex), [3, 5, 2, 4, 7]);
assert.deepEqual(prioritize(source), report);
assert.equal(JSON.stringify(source), sourceSnapshot);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
report.groups[1].findings[0].expected.push('TAMPER');
report.urgentFindings[2].actual.push('TAMPER');
report.priorityFindings[0].expected.push('TAMPER');
assert.equal(JSON.stringify(source), sourceSnapshot);
assert(!JSON.stringify(prioritize(source)).includes('TAMPER'));

const highOnly = prioritize(make([finding('high', 'high', 'diagnostic-regression'),
  finding('medium', 'medium', 'ordering-or-count')]));
assert.equal(highOnly.highestSeverity, 'high');
assert.deepEqual(highOnly.priorityFindings.map(f => f.field), ['high']);
assert.deepEqual(highOnly.urgentFindings.map(f => f.field), ['high']);
const mediumOnly = prioritize(make([finding('medium', 'medium', 'ordering-or-count')]));
assert.equal(mediumOnly.highestSeverity, 'medium');
assert.deepEqual(mediumOnly.priorityFindings.map(f => f.field), ['medium']);
assert.deepEqual(mediumOnly.urgentFindings, []);

for (const invalid of [null, {}, { ...source, kind: 'wrong' },
  { ...source, findings: null }, { ...source, findingCount: 99 }]) {
  assert.throws(() => prioritize(invalid), { code: 'INVALID_SUMMARY_COMPARISON_SEVERITY_REPORT' });
}
for (const bad of [null, {}, { ...synthetic[0], severity: 'unknown' },
  { ...synthetic[0], category: '' }, { ...synthetic[0], field: 3 },
  { ...synthetic[0], code: null }]) {
  assert.throws(() => prioritize(make([bad])),
    { code: 'INVALID_SUMMARY_COMPARISON_CLASSIFIED_FINDING' });
}
console.log('Mission 696 independent synthetic priority contract tests passed.');
