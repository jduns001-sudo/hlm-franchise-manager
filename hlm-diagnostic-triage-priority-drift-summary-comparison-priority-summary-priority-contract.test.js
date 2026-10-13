'use strict';

/** Mission 708: independent literal-only contract for Mission 707. */
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityReport: summarize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-report');

const KIND = 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-severity-report';
const make = findings => ({
  kind: KIND,
  version: 1,
  baselineVersion: 9,
  matrixVersion: 12,
  findingCount: findings.length,
  findings,
  simulationAuthorized: false,
  sourceStateMutated: false,
  persistencePerformed: false
});
const finding = (severity, category, field, expected, actual) => ({
  severity, category, field, code: 'SYNTHETIC_' + field,
  scenario: 'literal', expected, actual
});

const emptyInput = make([]);
const empty = summarize(emptyInput);
assert.equal(empty.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-report');
assert.equal(empty.version, 1);
assert.equal(empty.baselineVersion, 9);
assert.equal(empty.matrixVersion, 12);
assert.equal(empty.hasDrift, false);
assert.equal(empty.findingCount, 0);
assert.equal(empty.highestSeverity, null);
assert.equal(empty.categoryCount, 0);
assert.deepEqual(empty.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(empty.groups, []);
assert.deepEqual(empty.priorityFindings, []);
assert.deepEqual(empty.urgentFindings, []);

const input = make([
  finding('low', 'metadata', 'low-a', ['low-before'], ['low-after']),
  finding('high', 'zeta', 'high-a', ['before'], ['after']),
  finding('medium', 'order', 'medium-a', ['m'], ['n']),
  finding('critical', 'safety', 'critical-a', ['off'], ['on']),
  finding('high', 'alpha', 'high-b', ['b'], ['c']),
  finding('critical', 'safety', 'critical-b', ['no'], ['yes']),
  finding('high', 'zeta', 'high-c', ['old'], ['new']),
  finding('medium', 'order', 'medium-b', ['x'], ['y']),
  finding('low', 'metadata', 'low-b', ['p'], ['q'])
]);
const before = JSON.stringify(input);
const report = summarize(input);
assert.equal(JSON.stringify(input), before);
assert.equal(report.hasDrift, true);
assert.equal(report.findingCount, 9);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 2, high: 3, medium: 2, low: 2 });
assert.equal(report.categoryCount, 5);
assert.deepEqual(report.groups.map(group => group.category),
  ['safety', 'alpha', 'zeta', 'order', 'metadata']);
assert.deepEqual(report.groups.map(group => group.count), [2, 1, 2, 2, 2]);
assert.deepEqual(report.groups.map(group => group.highestSeverity),
  ['critical', 'high', 'high', 'medium', 'low']);
assert.deepEqual(report.groups.map(group => group.counts), [
  { critical: 2, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 1, medium: 0, low: 0 },
  { critical: 0, high: 2, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 2 }
]);
assert.deepEqual(report.groups.map(group => group.findings.map(item => item.field)), [
  ['critical-a', 'critical-b'],
  ['high-b'],
  ['high-a', 'high-c'],
  ['medium-a', 'medium-b'],
  ['low-a', 'low-b']
]);
assert.deepEqual(report.priorityFindings.map(item => item.field), ['critical-a', 'critical-b']);
assert.deepEqual(report.priorityFindings.map(item => item.originalIndex), [3, 5]);
assert.deepEqual(report.urgentFindings.map(item => item.field),
  ['critical-a', 'critical-b', 'high-a', 'high-b', 'high-c']);
assert.deepEqual(report.urgentFindings.map(item => item.originalIndex), [3, 5, 1, 4, 6]);
assert.equal(report.baselineVersion, 9);
assert.equal(report.matrixVersion, 12);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
assert.deepEqual(summarize(input), summarize(input));
report.groups[0].findings[0].field = 'TAMPER';
report.groups[0].findings[1].actual.push('TAMPER');
report.priorityFindings[0].expected.push('TAMPER');
report.urgentFindings[0].actual.push('TAMPER');
report.counts.critical = 999;
report.groups[0].counts.critical = 999;
report.groups.reverse();
assert.equal(JSON.stringify(input), before);
assert(!JSON.stringify(summarize(input)).includes('TAMPER'));

const highOnly = summarize(make([
  finding('high', 'zeta', 'z', ['a'], ['b']),
  finding('high', 'alpha', 'a', ['c'], ['d'])
]));
assert.equal(highOnly.highestSeverity, 'high');
assert.deepEqual(highOnly.groups.map(g => g.category), ['alpha', 'zeta']);
assert.deepEqual(highOnly.priorityFindings.map(f => f.field), ['z', 'a']);
assert.deepEqual(highOnly.urgentFindings.map(f => f.field), ['z', 'a']);

const mediumOnly = summarize(make([finding('medium', 'order', 'm', [], [])]));
assert.equal(mediumOnly.highestSeverity, 'medium');
assert.deepEqual(mediumOnly.priorityFindings.map(f => f.field), ['m']);
assert.deepEqual(mediumOnly.urgentFindings, []);

const lowOnly = summarize(make([finding('low', 'metadata', 'l', [], [])]));
assert.equal(lowOnly.highestSeverity, 'low');
assert.deepEqual(lowOnly.priorityFindings.map(f => f.field), ['l']);
assert.deepEqual(lowOnly.urgentFindings, []);

for (const invalid of [null, [], {}, { ...emptyInput, kind: 'other' },
  { ...emptyInput, findings: null }, { ...emptyInput, findingCount: 2 }]) {
  assert.throws(() => summarize(invalid), { code: 'INVALID_PRIORITY_SUMMARY_SEVERITY_REPORT' });
}
for (const invalid of [
  null, [], 'string',
  { severity: 'extreme', category: 'x', field: 'f', code: 'X' },
  { severity: 'high', category: '', field: 'f', code: 'X' },
  { severity: 'high', category: ' ', field: 'f', code: 'X' },
  { severity: 'high', category: 3, field: 'f', code: 'X' },
  { severity: 'high', category: 'x', field: 1, code: 'X' },
  { severity: 'high', category: 'x', field: 'f', code: null }
]) {
  assert.throws(() => summarize(make([invalid])),
    { code: 'INVALID_PRIORITY_SUMMARY_CLASSIFIED_FINDING' });
}
console.log('Mission 708 independent synthetic priority summary contract tests passed.');
