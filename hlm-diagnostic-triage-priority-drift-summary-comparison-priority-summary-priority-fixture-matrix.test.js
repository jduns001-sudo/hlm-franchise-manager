'use strict';
const assert = require('node:assert/strict');
const {
  PRIORITY_SUMMARY_PRIORITY_SCENARIO_NAMES: names,
  createPrioritySummaryPriorityScenarioInput: scenarioInput,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix: matrix
} = require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityReport: prioritize } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-report');

assert.deepEqual(names, ['clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority']);
assert(Object.isFrozen(names));
const expected = [
  {
    scenario: 'clean', hasDrift: false, findingCount: 0, highestSeverity: null,
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0 }, categoryCount: 0,
    categoryNames: [], priorityFields: [], urgentFields: [], simulationAuthorized: false
  },
  {
    scenario: 'safetyViolation', hasDrift: true, findingCount: 1, highestSeverity: 'critical',
    severityCounts: { critical: 1, high: 0, medium: 0, low: 0 }, categoryCount: 1,
    categoryNames: ['safety-invariant'], priorityFields: ['simulationAuthorized'],
    urgentFields: ['simulationAuthorized'], simulationAuthorized: false
  },
  {
    scenario: 'diagnosticRegression', hasDrift: true, findingCount: 3, highestSeverity: 'high',
    severityCounts: { critical: 0, high: 3, medium: 0, low: 0 }, categoryCount: 1,
    categoryNames: ['diagnostic-regression'],
    priorityFields: ['highestSeverity', 'severityCounts.high', 'priorityFields'],
    urgentFields: ['highestSeverity', 'severityCounts.high', 'priorityFields'], simulationAuthorized: false
  },
  {
    scenario: 'orderingChange', hasDrift: true, findingCount: 2, highestSeverity: 'medium',
    severityCounts: { critical: 0, high: 0, medium: 2, low: 0 }, categoryCount: 1,
    categoryNames: ['ordering-or-count'], priorityFields: ['scenarioNames', 'categoryNames'],
    urgentFields: [], simulationAuthorized: false
  },
  {
    scenario: 'mixedPriority', hasDrift: true, findingCount: 7, highestSeverity: 'critical',
    severityCounts: { critical: 1, high: 3, medium: 2, low: 1 }, categoryCount: 4,
    categoryNames: ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'],
    priorityFields: ['simulationAuthorized'],
    urgentFields: ['simulationAuthorized', 'highestSeverity', 'severityCounts.high', 'priorityFields'],
    simulationAuthorized: false
  }
];
const result = matrix();
assert.equal(result.kind, 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix');
assert.equal(result.version, 1);
assert.equal(result.scenarioCount, 5);
assert.deepEqual(result.rows, expected);
assert.deepEqual(matrix(), result);
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(result[flag], false);
}
for (const name of names) {
  const input = scenarioInput(name);
  const snapshot = JSON.stringify(input);
  const output = prioritize(input);
  assert.equal(JSON.stringify(input), snapshot);
  assert.equal(output.findingCount, input.findingCount);
  assert.equal(output.counts.critical + output.counts.high + output.counts.medium + output.counts.low, input.findingCount);
  for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
    assert.equal(input[flag], false);
    assert.equal(output[flag], false);
  }
}
const a = scenarioInput('mixedPriority');
const b = scenarioInput('mixedPriority');
assert.notStrictEqual(a, b);
assert.notStrictEqual(a.findings, b.findings);
assert.notStrictEqual(a.findings[0].expected, b.findings[0].expected);
a.findings[0].expected.push('TAMPER');
a.findings[0].field = 'TAMPER';
assert(!JSON.stringify(b).includes('TAMPER'));
assert(!JSON.stringify(matrix()).includes('TAMPER'));
const mutable = matrix();
mutable.rows[4].categoryNames.reverse();
mutable.rows[4].priorityFields.push('TAMPER');
mutable.rows[1].severityCounts.critical = 999;
assert.deepEqual(matrix(), result);
assert(!JSON.stringify(matrix()).includes('TAMPER'));
assert.throws(() => scenarioInput('unknown'), { code: 'UNKNOWN_PRIORITY_SUMMARY_PRIORITY_SCENARIO' });
console.log('Mission 709 priority summary priority fixture matrix tests passed.');
