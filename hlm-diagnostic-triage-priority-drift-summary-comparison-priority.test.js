'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityReport: prioritize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority');
const { createDiagnosticTriagePriorityDriftSummaryComparisonSeverityReport: severity } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-severity');
const { createDiagnosticTriagePriorityDriftSummaryComparisonReport: compare } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-report');
const { createDiagnosticTriagePriorityDriftSummaryFixtureMatrix: fixture } =
  require('./hlm-diagnostic-triage-priority-drift-summary-fixture-matrix');

const clean = prioritize();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.findingCount, 0);
assert.equal(clean.hasDrift, false);
assert.equal(clean.highestSeverity, null);
assert.equal(clean.categoryCount, 0);
assert.deepEqual(clean.counts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(clean.groups, []);
assert.deepEqual(clean.priorityFindings, []);
assert.deepEqual(clean.urgentFindings, []);
assert.deepEqual(prioritize(), clean);

const matrix = fixture();
matrix.version += 1;
matrix.simulationAuthorized = true;
matrix.rows.reverse();
const mixed = matrix.rows.find(row => row.scenario === 'mixedPriority');
mixed.severityCounts.high += 1;
mixed.priorityFields.push('unexpected');
mixed.categoryNames.reverse();
const input = severity(compare(matrix));
const snapshot = JSON.stringify(input);
const result = prioritize(input);
assert.equal(result.hasDrift, true);
assert.equal(result.findingCount, 6);
assert.equal(result.highestSeverity, 'critical');
assert.deepEqual(result.counts, { critical: 1, high: 2, medium: 2, low: 1 });
assert.equal(result.categoryCount, 4);
assert.deepEqual(result.groups.map(group => group.category),
  ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other']);
assert.deepEqual(result.groups.map(group => group.count), [1, 2, 2, 1]);
assert.deepEqual(result.groups.map(group => group.highestSeverity),
  ['critical', 'high', 'medium', 'low']);
assert.deepEqual(result.groups.map(group => group.counts), [
  { critical: 1, high: 0, medium: 0, low: 0 },
  { critical: 0, high: 2, medium: 0, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 1 }
]);
assert.deepEqual(result.priorityFindings.map(f => f.field), ['simulationAuthorized']);
assert.deepEqual(result.urgentFindings.map(f => f.field),
  ['simulationAuthorized', 'severityCounts.high', 'priorityFields']);
assert.deepEqual(result.urgentFindings.map(f => f.originalIndex), [1, 3, 5]);
assert.deepEqual(result.groups[2].findings.map(f => f.field), ['scenarioNames', 'categoryNames']);
assert.deepEqual(prioritize(input), result);
assert.equal(JSON.stringify(input), snapshot);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) assert.equal(result[flag], false);
result.groups[2].findings[1].actual.push('TAMPER');
result.urgentFindings[2].actual.push('TAMPER');
assert.equal(JSON.stringify(input), snapshot);
assert(!JSON.stringify(prioritize(input)).includes('TAMPER'));

assert.throws(() => prioritize(null), { code: 'INVALID_SUMMARY_COMPARISON_SEVERITY_REPORT' });
assert.throws(() => prioritize({ ...input, findingCount: 99 }),
  { code: 'INVALID_SUMMARY_COMPARISON_SEVERITY_REPORT' });
assert.throws(() => prioritize({ ...input, findings: [{ field: 'x', code: 'X', severity: 'bogus', category: 'x' }], findingCount: 1 }),
  { code: 'INVALID_SUMMARY_COMPARISON_CLASSIFIED_FINDING' });
console.log('Mission 695 summary comparison priority report tests passed.');
