'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriageFixtureMatrix } = require('./hlm-diagnostic-triage-fixture-matrix');
const {
  PRIORITY_SCENARIO_NAMES, createPriorityScenarioInput, createDiagnosticTriagePriorityFixtureMatrix
} = require('./hlm-diagnostic-triage-priority-fixture-matrix');

// Independently specified expected scenario outcomes, not derived from matrix output.
const expected = [
  ['clean', false, 0, null, [0, 0, 0, 0], [], []],
  ['safetyViolation', true, 1, 'critical', [1, 0, 0, 0],
    ['safety-invariant'], ['simulationAuthorized']],
  ['diagnosticRegression', true, 2, 'high', [0, 2, 0, 0],
    ['diagnostic-regression'], ['highestSeverity', 'severityCounts.high']],
  ['orderingChange', true, 1, 'medium', [0, 0, 1, 0],
    ['ordering-or-count'], ['categoryNames']],
  ['mixedPriority', true, 5, 'critical', [1, 2, 1, 1],
    ['safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'],
    ['simulationAuthorized']]
];

assert.deepEqual(PRIORITY_SCENARIO_NAMES, expected.map(row => row[0]));
assert(Object.isFrozen(PRIORITY_SCENARIO_NAMES));
const baselineBefore = JSON.stringify(createDiagnosticTriageFixtureMatrix());
const result = createDiagnosticTriagePriorityFixtureMatrix();
assert.equal(result.kind, 'franchise-diagnostic-triage-priority-fixture-matrix');
assert.equal(result.version, 1);
assert.equal(result.scenarioCount, 5);
assert.equal(result.rows.length, 5);
for (let index = 0; index < expected.length; index += 1) {
  const [name, hasDrift, findingCount, highestSeverity, counts, categories, priorities] = expected[index];
  const row = result.rows[index];
  assert.equal(row.scenario, name);
  assert.equal(row.hasDrift, hasDrift, name);
  assert.equal(row.findingCount, findingCount, name);
  assert.equal(row.highestSeverity, highestSeverity, name);
  assert.deepEqual(['critical', 'high', 'medium', 'low'].map(level => row.severityCounts[level]), counts, name);
  assert.equal(row.categoryCount, categories.length, name);
  assert.deepEqual(row.categoryNames, categories, name);
  assert.deepEqual(row.priorityFields, priorities, name);
  assert.equal(row.simulationAuthorized, false, name);
}
assert.equal(result.simulationAuthorized, false);
assert.equal(result.sourceStateMutated, false);
assert.equal(result.persistencePerformed, false);
assert.equal(JSON.stringify(createDiagnosticTriageFixtureMatrix()), baselineBefore);
assert.deepEqual(createDiagnosticTriagePriorityFixtureMatrix(), result, 'deterministic matrix');

// Each scenario gets a fresh input; edits to one cannot contaminate the next.
const safety = createPriorityScenarioInput('safetyViolation');
const clean = createPriorityScenarioInput('clean');
assert.equal(safety.simulationAuthorized, true);
assert.equal(clean.simulationAuthorized, false);
safety.rows[0].categoryNames.push('TAMPER');
assert(!JSON.stringify(createPriorityScenarioInput('safetyViolation')).includes('TAMPER'));
result.rows[0].categoryNames.push('TAMPER');
result.rows[1].severityCounts.critical = 999;
assert(!JSON.stringify(createDiagnosticTriagePriorityFixtureMatrix()).includes('TAMPER'));
assert.equal(createDiagnosticTriagePriorityFixtureMatrix().rows[1].severityCounts.critical, 1);
assert.equal(JSON.stringify(createDiagnosticTriageFixtureMatrix()), baselineBefore);

assert.throws(() => createPriorityScenarioInput('not-a-scenario'), { code: 'UNKNOWN_PRIORITY_SCENARIO' });
assert.throws(() => createPriorityScenarioInput(null), { code: 'UNKNOWN_PRIORITY_SCENARIO' });
console.log('Mission 685 diagnostic triage priority fixture matrix tests passed.');
