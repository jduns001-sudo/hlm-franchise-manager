'use strict';
/**
 * Mission 678: independent contract assertions for Mission 677.
 * No production modules or browser state are modified.
 */
const assert = require('node:assert/strict');
const { createDiagnosticTriageSummary } = require('./hlm-diagnostic-triage-summary');

const order = ['critical', 'high', 'medium', 'low'];
const makeFinding = (severity, category, field, index) => ({
  severity, category, fixture: 'fixture-' + index, field,
  code: 'BASELINE_VALUE_CHANGED', expected: [index, index + 1],
  actual: [index + 2], originalIndex: index
});
const findings = [
  makeFinding('low', 'metadata-or-other', 'version', 0),
  makeFinding('high', 'data-quality-or-organization', 'dataQualityValid', 1),
  makeFinding('critical', 'safety-invariant', 'simulationAuthorized', 2),
  makeFinding('medium', 'roster-or-fixture', 'candidateCount', 3),
  makeFinding('high', 'canonical-diagnostic', 'errorCodes', 4),
  makeFinding('critical', 'safety-invariant', 'persistencePerformed', 5),
  makeFinding('medium', 'roster-or-fixture', 'teamCount', 6),
  makeFinding('high', 'data-quality-or-organization', 'unresolvedPlayerCount', 7)
];
const severity = {
  kind: 'franchise-diagnostic-drift-severity-report',
  version: 1, baselineVersion: 1, findingCount: findings.length,
  hasDrift: true, findings
};
const original = JSON.stringify(severity);
const triage = createDiagnosticTriageSummary(severity);
assert.equal(JSON.stringify(severity), original, 'contract must not mutate input');
assert.equal(triage.kind, 'franchise-diagnostic-triage-summary');
assert.equal(triage.baselineVersion, 1);
assert.equal(triage.findingCount, 8);
assert.equal(triage.categoryCount, 5);
assert.equal(triage.highestSeverity, 'critical');
assert.deepEqual(triage.counts, { critical: 2, high: 3, medium: 2, low: 1 });
assert.deepEqual(triage.groups.map(group => group.category), [
  'safety-invariant', 'canonical-diagnostic', 'data-quality-or-organization',
  'roster-or-fixture', 'metadata-or-other'
]);
assert.deepEqual(triage.priorityFindings.map(f => f.originalIndex), [2, 5],
  'priority preserves source order for equal severity');
assert.deepEqual(triage.groups.find(g => g.category === 'data-quality-or-organization').findings.map(f => f.originalIndex), [1, 7]);
assert.deepEqual(triage.groups.find(g => g.category === 'roster-or-fixture').findings.map(f => f.originalIndex), [3, 6]);
for (const group of triage.groups) {
  assert.equal(group.count, group.findings.length);
  assert.equal(group.count, Object.values(group.counts).reduce((a, b) => a + b, 0));
  assert(group.findings.every(f => f.category === group.category));
  assert.equal(group.highestSeverity, order.find(level => group.counts[level] > 0));
  assert(group.findings.every((f, i) => i === 0 ||
    order.indexOf(group.findings[i - 1].severity) <= order.indexOf(f.severity)));
}
assert.equal(triage.groups.reduce((sum, g) => sum + g.count, 0), triage.findingCount);
assert.equal(Object.values(triage.counts).reduce((sum, n) => sum + n, 0), triage.findingCount);
assert.equal(triage.simulationAuthorized, false);
assert.equal(triage.sourceStateMutated, false);
assert.equal(triage.persistencePerformed, false);
assert.deepEqual(createDiagnosticTriageSummary(severity), triage, 'deterministic results');

triage.groups[0].findings[0].expected.push(999);
triage.priorityFindings[0].actual.push(999);
triage.counts.critical = 900;
triage.groups[0].counts.critical = 900;
assert.equal(JSON.stringify(severity), original, 'mutating result cannot affect source');
const again = createDiagnosticTriageSummary(severity);
assert.deepEqual(again.counts, { critical: 2, high: 3, medium: 2, low: 1 });
assert.deepEqual(again.priorityFindings[0].actual, [4]);
assert.deepEqual(again.groups[0].findings[0].expected, [2, 3]);

const onlyHigh = {
  kind: severity.kind, baselineVersion: 1, findingCount: 2,
  findings: [makeFinding('high', 'canonical-diagnostic', 'errorCodes', 0),
    makeFinding('low', 'metadata-or-other', 'version', 1)]
};
const highSummary = createDiagnosticTriageSummary(onlyHigh);
assert.equal(highSummary.highestSeverity, 'high');
assert.deepEqual(highSummary.priorityFindings.map(f => f.field), ['errorCodes']);
const empty = createDiagnosticTriageSummary({
  kind: severity.kind, baselineVersion: 1, findingCount: 0, findings: []
});
assert.equal(empty.highestSeverity, null);
assert.equal(empty.categoryCount, 0);
assert.deepEqual(empty.priorityFindings, []);
assert.equal(empty.hasDrift, false);
for (const input of [null, {}, { kind: severity.kind, findingCount: 1, findings: [] }]) {
  assert.throws(() => createDiagnosticTriageSummary(input), { code: 'INVALID_SEVERITY_REPORT' });
}
for (const bad of [
  { ...makeFinding('unknown', 'x', 'field', 0) },
  { ...makeFinding('high', '', 'field', 0) },
  null
]) {
  assert.throws(() => createDiagnosticTriageSummary({
    kind: severity.kind, findingCount: 1, findings: [bad]
  }), { code: 'INVALID_CLASSIFIED_FINDING' });
}
console.log('Mission 678 diagnostic triage contract tests passed.');
