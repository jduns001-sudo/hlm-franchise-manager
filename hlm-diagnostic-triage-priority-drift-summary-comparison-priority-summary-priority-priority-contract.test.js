'use strict';
// Mission 714: independent literal-only contract for Mission 713.
// Do not import fixture matrices, drift generators, or severity classifiers.
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityReport: summarize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-report');

const kind = 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-severity-report';
const makeFinding = (severity, category, field, index) => ({
  severity, category, scenario: 'synthetic-' + index, field, code: 'SYNTHETIC_' + index,
  expected: ['before-' + index], actual: ['after-' + index], originalIndex: 100 + index
});
const findings = [
  makeFinding('low', 'metadata-z', 'version', 0),
  makeFinding('high', 'diagnostic-z', 'highestSeverity', 1),
  makeFinding('medium', 'ordering-b', 'categoryNames', 2),
  makeFinding('critical', 'safety-z', 'simulationAuthorized', 3),
  makeFinding('high', 'diagnostic-a', 'priorityFields', 4),
  makeFinding('critical', 'safety-a', 'persistencePerformed', 5),
  makeFinding('medium', 'ordering-a', 'scenarioNames', 6),
  makeFinding('high', 'diagnostic-z', 'urgentFields', 7),
  makeFinding('low', 'metadata-a', 'kind', 8)
];
const source = {
  kind, baselineVersion: 7, matrixVersion: 11,
  findingCount: 9, hasDrift: true, highestSeverity: 'critical',
  counts: { critical: 2, high: 3, medium: 2, low: 2 },
  findings, simulationAuthorized: false, sourceStateMutated: false, persistencePerformed: false
};
const snapshot = JSON.stringify(source);
const report = summarize(source);
assert.equal(report.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-report');
assert.equal(report.version, 1);
assert.equal(report.baselineVersion, 7);
assert.equal(report.matrixVersion, 11);
assert.equal(report.hasDrift, true);
assert.equal(report.findingCount, 9);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 2, high: 3, medium: 2, low: 2 });
assert.equal(report.categoryCount, 8);
assert.deepEqual(report.groups.map(g => g.category), [
  'safety-a', 'safety-z', 'diagnostic-a', 'diagnostic-z',
  'ordering-a', 'ordering-b', 'metadata-a', 'metadata-z'
]);
assert.deepEqual(report.groups.map(g => [g.count, g.highestSeverity]), [
  [1, 'critical'], [1, 'critical'], [1, 'high'], [2, 'high'],
  [1, 'medium'], [1, 'medium'], [1, 'low'], [1, 'low']
]);
assert.deepEqual(report.groups.map(g => g.counts), [
  { critical: 1, high: 0, medium: 0, low: 0 },
  { critical: 1, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 1, medium: 0, low: 0 },
  { critical: 0, high: 2, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 1, low: 0 },
  { critical: 0, high: 0, medium: 1, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 1 },
  { critical: 0, high: 0, medium: 0, low: 1 }
]);
assert.deepEqual(report.groups.map(g => g.findings.map(f => f.field)), [
  ['persistencePerformed'], ['simulationAuthorized'], ['priorityFields'],
  ['highestSeverity', 'urgentFields'], ['scenarioNames'], ['categoryNames'], ['kind'], ['version']
]);
assert.deepEqual(report.groups.flatMap(g => g.findings).map(f => f.originalIndex),
  [5, 3, 4, 1, 7, 6, 2, 8, 0]);
assert.deepEqual(report.priorityFindings.map(f => f.field),
  ['simulationAuthorized', 'persistencePerformed']);
assert.deepEqual(report.urgentFindings.map(f => f.field),
  ['simulationAuthorized', 'persistencePerformed', 'highestSeverity', 'priorityFields', 'urgentFields']);
assert.deepEqual(report.priorityFindings.map(f => f.originalIndex), [3, 5]);
assert.deepEqual(report.urgentFindings.map(f => f.originalIndex), [3, 5, 1, 4, 7]);
assert.equal(JSON.stringify(source), snapshot);
assert.deepEqual(summarize(source), report);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}

const grouped = report.groups[3].findings[0];
const urgent = report.urgentFindings.find(f => f.field === grouped.field);
assert.notStrictEqual(grouped, urgent);
assert.notStrictEqual(grouped.expected, urgent.expected);
assert.notStrictEqual(grouped.actual, urgent.actual);
assert.notStrictEqual(grouped.expected, findings[1].expected);
assert.notStrictEqual(grouped.actual, findings[1].actual);
grouped.expected.push('TAMPER');
grouped.actual.push('TAMPER');
urgent.expected.push('TAMPER');
urgent.actual.push('TAMPER');
report.priorityFindings[0].field = 'TAMPER';
report.groups.reverse();
report.counts.critical = 100;
assert.equal(JSON.stringify(source), snapshot);
assert(!JSON.stringify(summarize(source)).includes('TAMPER'));

const empty = summarize({ ...source, findings: [], findingCount: 0 });
assert.equal(empty.hasDrift, false);
assert.equal(empty.highestSeverity, null);
assert.deepEqual(empty.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.equal(empty.categoryCount, 0);
assert.deepEqual(empty.groups, []);
assert.deepEqual(empty.priorityFindings, []);
assert.deepEqual(empty.urgentFindings, []);
for (const level of ['critical', 'high', 'medium', 'low']) {
  const subset = findings.filter(f => f.severity === level);
  const only = summarize({ ...source, findings: subset, findingCount: subset.length });
  assert.equal(only.highestSeverity, level);
  assert.equal(only.findingCount, subset.length);
  assert.equal(only.priorityFindings.length, subset.length);
  assert.equal(only.urgentFindings.length, level === 'critical' || level === 'high' ? subset.length : 0);
}
const ties = [
  makeFinding('high', 'zeta', 'first', 0),
  makeFinding('high', 'alpha', 'second', 1),
  makeFinding('high', 'zeta', 'third', 2)
];
const tieReport = summarize({ ...source, findings: ties, findingCount: 3 });
assert.deepEqual(tieReport.urgentFindings.map(f => f.field), ['first', 'second', 'third']);
assert.deepEqual(tieReport.groups.map(g => g.category), ['alpha', 'zeta']);
assert.deepEqual(tieReport.groups[1].findings.map(f => f.field), ['first', 'third']);

// An omitted/undefined argument intentionally invokes the default clean report.
assert.deepEqual(summarize(undefined), summarize());
for (const bad of [null, [], {}, { kind: 'wrong', findings: [], findingCount: 0 },
  { kind, findings: null, findingCount: 0 }, { kind, findings: [], findingCount: 1 }]) {
  assert.throws(() => summarize(bad), { code: 'INVALID_PRIORITY_SUMMARY_PRIORITY_SEVERITY_REPORT' });
}
for (const bad of [null, [], 4, { ...findings[0], severity: 'unknown' },
  { ...findings[0], category: '' }, { ...findings[0], field: null },
  { ...findings[0], code: null }]) {
  assert.throws(() => summarize({ kind, findings: [bad], findingCount: 1 }),
    { code: 'INVALID_PRIORITY_SUMMARY_PRIORITY_CLASSIFIED_FINDING' });
}
console.log('Mission 714 independent priority summary contract tests passed.');
