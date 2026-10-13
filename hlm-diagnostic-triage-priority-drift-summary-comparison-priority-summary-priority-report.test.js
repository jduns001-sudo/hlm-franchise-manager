'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityReport: prioritize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryDriftReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummarySeverityReport: severity } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-severity');

const clean = prioritize();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-report');
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
assert.deepEqual(prioritize(), clean);

const matrix = fixture();
matrix.version = 2;
matrix.simulationAuthorized = true;
matrix.rows.reverse();
const row = matrix.rows.find(item => item.scenario === 'mixedPriority');
row.highestSeverity = 'low';
row.severityCounts.high++;
row.categoryNames.reverse();
row.priorityFields.push('extra');
row.urgentFields.push('extra');
const classified = severity(compare(matrix));
const before = JSON.stringify(classified);
const report = prioritize(classified);
assert.equal(report.hasDrift, true);
assert.equal(report.findingCount, 8);
assert.equal(report.highestSeverity, 'critical');
assert.deepEqual(report.counts, { critical: 1, high: 4, medium: 2, low: 1 });
assert.deepEqual(report.groups.map(g => g.category),
  ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other']);
assert.deepEqual(report.groups.map(g => g.count), [1, 4, 2, 1]);
assert.deepEqual(report.groups.map(g => g.highestSeverity), ['critical', 'high', 'medium', 'low']);
assert.equal(report.categoryCount, 4);
assert.deepEqual(report.priorityFindings.map(f => f.field), ['simulationAuthorized']);
assert.deepEqual(report.urgentFindings.map(f => f.field),
  ['simulationAuthorized', 'highestSeverity', 'severityCounts.high', 'priorityFields', 'urgentFields']);
assert.deepEqual(report.urgentFindings.map(f => f.originalIndex), [1, 3, 4, 6, 7]);
assert.deepEqual(report.groups.map(g => g.counts),
  [{ critical: 1, high: 0, medium: 0, low: 0 },
   { critical: 0, high: 4, medium: 0, low: 0 },
   { critical: 0, high: 0, medium: 2, low: 0 },
   { critical: 0, high: 0, medium: 0, low: 1 }]);
assert.equal(JSON.stringify(classified), before);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(report[flag], false);
}
report.groups[0].findings[0].field = 'TAMPER';
report.urgentFindings[0].field = 'TAMPER';
report.priorityFindings[0].field = 'TAMPER';
report.groups[2].findings[0].expected.push('TAMPER');
report.counts.critical = 999;
assert.equal(JSON.stringify(classified), before);
assert(!JSON.stringify(prioritize(classified)).includes('TAMPER'));
assert.deepEqual(prioritize(classified), prioritize(classified));

const synthetic = {
  ...classified,
  findings: [
    { severity: 'high', category: 'zeta', field: 'first', code: 'X', expected: ['A'], actual: ['B'] },
    { severity: 'critical', category: 'safety', field: 'critical', code: 'X' },
    { severity: 'high', category: 'alpha', field: 'second', code: 'X' },
    { severity: 'high', category: 'zeta', field: 'third', code: 'X' },
    { severity: 'low', category: 'metadata', field: 'low', code: 'X' },
    { severity: 'medium', category: 'order', field: 'medium', code: 'X' }
  ],
  findingCount: 6
};
const ordered = prioritize(synthetic);
assert.deepEqual(ordered.groups.map(g => g.category), ['safety', 'alpha', 'zeta', 'order', 'metadata']);
assert.deepEqual(ordered.groups.find(g => g.category === 'zeta').findings.map(f => f.field),
  ['first', 'third']);
assert.deepEqual(ordered.urgentFindings.map(f => f.field),
  ['critical', 'first', 'second', 'third']);
assert.deepEqual(ordered.urgentFindings.map(f => f.originalIndex), [1, 0, 2, 3]);
assert.deepEqual(ordered.counts, { critical: 1, high: 3, medium: 1, low: 1 });
const ties = prioritize({ ...synthetic, findings: [
  { severity: 'high', category: 'zeta', field: 'z', code: 'X' },
  { severity: 'high', category: 'alpha', field: 'a', code: 'X' }
], findingCount: 2 });
assert.deepEqual(ties.groups.map(g => g.category), ['alpha', 'zeta']);
assert.deepEqual(ties.urgentFindings.map(f => f.field), ['z', 'a']);
assert.equal(ties.highestSeverity, 'high');
assert.equal(ties.priorityFindings.length, 2);
for (const invalid of [null, [], {}, { ...classified, kind: 'wrong' },
  { ...classified, findings: null }, { ...classified, findingCount: 99 }]) {
  assert.throws(() => prioritize(invalid), { code: 'INVALID_PRIORITY_SUMMARY_SEVERITY_REPORT' });
}
for (const finding of [null, [], { severity: 'urgent', category: 'x', field: 'x', code: 'X' },
  { severity: 'high', category: '', field: 'x', code: 'X' },
  { severity: 'high', category: 'x', field: null, code: 'X' }]) {
  assert.throws(() => prioritize({ ...classified, findings: [finding], findingCount: 1 }),
    { code: 'INVALID_PRIORITY_SUMMARY_CLASSIFIED_FINDING' });
}
console.log('Mission 707 priority summary report tests passed.');
