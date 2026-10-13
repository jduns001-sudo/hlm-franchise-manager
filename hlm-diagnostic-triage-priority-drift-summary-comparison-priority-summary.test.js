'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummary: summarize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySeverityReport: severity } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport: drift } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix');

const clean = summarize();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary');
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
matrix.version += 1;
matrix.simulationAuthorized = true;
matrix.rows.reverse();
const mixed = matrix.rows.find(row => row.scenario === 'mixedPriority');
mixed.highestSeverity = 'medium';
mixed.severityCounts.high += 1;
mixed.categoryNames.reverse();
mixed.urgentFields.push('unexpected');
mixed.simulationAuthorized = true;
const input = severity(drift(matrix));
const before = JSON.stringify(input);
const result = summarize(input);
assert.equal(result.findingCount, 8);
assert.equal(result.hasDrift, true);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, { critical: 2, high: 3, medium: 2, low: 1 });
assert.equal(result.categoryCount, 4);
assert.deepEqual(result.groups.map(g => g.category),
  ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other']);
assert.deepEqual(result.groups.map(g => g.count), [2, 3, 2, 1]);
assert.deepEqual(result.groups.map(g => g.highestSeverity), ['critical', 'high', 'medium', 'low']);
assert.deepEqual(result.groups.map(g => g.counts), [
  { critical: 2, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 3, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 1 }
]);
assert.deepEqual(result.priorityFindings.map(f => f.field),
  ['simulationAuthorized', 'simulationAuthorized']);
assert.deepEqual(result.urgentFindings.map(f => f.field),
  ['simulationAuthorized', 'simulationAuthorized', 'highestSeverity', 'severityCounts.high', 'urgentFields']);
assert.deepEqual(result.urgentFindings.map(f => f.originalIndex), [1, 7, 3, 4, 6]);
assert.deepEqual(result.groups[2].findings.map(f => f.field), ['scenarioNames', 'categoryNames']);
assert.deepEqual(summarize(input), result);
assert.equal(JSON.stringify(input), before);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
result.groups[2].findings[1].actual.push('TAMPER');
result.urgentFindings[4].actual.push('TAMPER');
assert.equal(JSON.stringify(input), before);
assert(!JSON.stringify(summarize(input)).includes('TAMPER'));

const synthetic = {
  kind: input.kind, baselineVersion: 1, matrixVersion: 1,
  findings: [
    { scenario: 'x', field: 'z', code: 'Z', severity: 'high', category: 'zeta', actual: ['one'], expected: [] },
    { scenario: 'x', field: 'a', code: 'A', severity: 'high', category: 'alpha', actual: [], expected: [] },
    { scenario: 'x', field: 'b', code: 'B', severity: 'high', category: 'zeta', actual: [], expected: [] }
  ],
  findingCount: 3
};
const tied = summarize(synthetic);
assert.deepEqual(tied.groups.map(g => g.category), ['alpha', 'zeta']);
assert.deepEqual(tied.groups[1].findings.map(f => f.field), ['z', 'b']);
assert.deepEqual(tied.urgentFindings.map(f => f.originalIndex), [0, 1, 2]);
assert.equal(tied.highestSeverity, 'high');
assert.equal(tied.priorityFindings.length, 3);
const mediumOnly = summarize({ ...synthetic, findings: [
  { field: 'count', code: 'X', severity: 'medium', category: 'ordering-or-count' }
], findingCount: 1 });
assert.equal(mediumOnly.highestSeverity, 'medium');
assert.equal(mediumOnly.urgentFindings.length, 0);
assert.equal(mediumOnly.priorityFindings.length, 1);
assert.throws(() => summarize(null), { code: 'INVALID_PRIORITY_BASELINE_SEVERITY_REPORT' });
assert.throws(() => summarize({ ...synthetic, findingCount: 99 }),
  { code: 'INVALID_PRIORITY_BASELINE_SEVERITY_REPORT' });
assert.throws(() => summarize({ ...synthetic, findings: [null], findingCount: 1 }),
  { code: 'INVALID_PRIORITY_BASELINE_CLASSIFIED_FINDING' });
assert.throws(() => summarize({ ...synthetic, findings: [{ field: 'x', code: 'X', severity: 'unknown', category: 'x' }], findingCount: 1 }),
  { code: 'INVALID_PRIORITY_BASELINE_CLASSIFIED_FINDING' });
console.log('Mission 701 priority baseline summary tests passed.');
