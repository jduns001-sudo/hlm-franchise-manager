'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityReport: summarize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPrioritySeverityReport: severity } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix');

const clean = summarize();
assert.equal(clean.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-report');
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
assert.deepEqual(clean.urgentFindings, []);
assert.deepEqual(summarize(), clean);

const matrix = fixture();
matrix.version = 2;
matrix.simulationAuthorized = true;
matrix.rows.reverse();
const row = matrix.rows.find(item => item.scenario === 'mixedPriority');
row.highestSeverity = 'low';
row.severityCounts.high = 99;
row.categoryNames.reverse();
row.priorityFields.push('unexpected');
row.urgentFields.push('unexpected');
row.simulationAuthorized = true;
const classified = severity(compare(matrix));
const original = JSON.stringify(classified);
const result = summarize(classified);
assert.equal(result.findingCount, 9);
assert.equal(result.hasDrift, true);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, { critical: 2, high: 4, medium: 2, low: 1 });
assert.equal(result.categoryCount, 4);
assert.deepEqual(result.groups.map(g => [g.category, g.count, g.highestSeverity]), [
  ['safety-invariant', 2, 'critical'],
  ['diagnostic-regression', 4, 'high'],
  ['ordering-or-count', 2, 'medium'],
  ['metadata-or-other', 1, 'low']
]);
assert.deepEqual(result.groups.map(g => g.counts), [
  { critical: 2, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 4, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 1 }
]);
assert.deepEqual(result.groups.map(g => g.findings.map(f => f.originalIndex)), [
  [1, 8], [3, 4, 6, 7], [2, 5], [0]
]);
assert.deepEqual(result.priorityFindings.map(f => f.originalIndex), [1, 8]);
assert.deepEqual(result.urgentFindings.map(f => f.originalIndex), [1, 8, 3, 4, 6, 7]);
assert.equal(JSON.stringify(classified), original);
assert.deepEqual(summarize(classified), result);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
  assert.equal(clean[flag], false);
}
const category = result.groups[2].findings.find(f => f.field === 'categoryNames');
const originalCategory = classified.findings.find(f => f.field === 'categoryNames');
assert.notStrictEqual(category.expected, originalCategory.expected);
assert.notStrictEqual(category.actual, originalCategory.actual);
assert.notStrictEqual(category.expected, result.urgentFindings[0].expected);
category.expected.push('TAMPER');
category.actual.push('TAMPER');
result.priorityFindings[0].field = 'TAMPER';
result.urgentFindings[0].field = 'TAMPER';
result.groups.reverse();
assert.equal(JSON.stringify(classified), original);
assert(!JSON.stringify(summarize(classified)).includes('TAMPER'));
assert.deepEqual(summarize(), clean);

const highOnly = {
  ...classified, findings: classified.findings.filter(f => f.severity === 'high')
};
highOnly.findingCount = highOnly.findings.length;
const highResult = summarize(highOnly);
assert.equal(highResult.highestSeverity, 'high');
assert.equal(highResult.priorityFindings.length, 4);
assert.equal(highResult.urgentFindings.length, 4);
const mediumOnly = { ...classified, findings: classified.findings.filter(f => f.severity === 'medium') };
mediumOnly.findingCount = mediumOnly.findings.length;
assert.equal(summarize(mediumOnly).urgentFindings.length, 0);
assert.equal(summarize(mediumOnly).priorityFindings.length, 2);
const lowOnly = { ...classified, findings: classified.findings.filter(f => f.severity === 'low') };
lowOnly.findingCount = lowOnly.findings.length;
assert.equal(summarize(lowOnly).highestSeverity, 'low');
assert.equal(summarize(lowOnly).urgentFindings.length, 0);
for (const invalid of [null, [], {}, { kind: 'wrong', findings: [], findingCount: 0 },
  { kind: classified.kind, findings: null, findingCount: 0 },
  { kind: classified.kind, findings: [], findingCount: 1 }]) {
  assert.throws(() => summarize(invalid), { code: 'INVALID_PRIORITY_SUMMARY_PRIORITY_SEVERITY_REPORT' });
}
for (const finding of [null, [], { severity: 'invalid', category: 'x', field: 'x', code: 'x' },
  { severity: 'high', category: '', field: 'x', code: 'x' },
  { severity: 'high', category: 'x', field: null, code: 'x' }]) {
  assert.throws(() => summarize({
    kind: classified.kind, findings: [finding], findingCount: 1
  }), { code: 'INVALID_PRIORITY_SUMMARY_PRIORITY_CLASSIFIED_FINDING' });
}
console.log('Mission 713 priority summary priority report tests passed.');
