'use strict';
const assert = require('node:assert/strict');
const {
  PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES,
  createPriorityDriftSummaryScenarioInput,
  createDiagnosticTriagePriorityDriftSummaryFixtureMatrix
} = require('./hlm-diagnostic-triage-priority-drift-summary-fixture-matrix');

assert.deepEqual(PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES, [
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);
assert(Object.isFrozen(PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES));
assert.throws(() => createPriorityDriftSummaryScenarioInput('unknown'),
  { code: 'UNKNOWN_PRIORITY_DRIFT_SUMMARY_SCENARIO' });

const cleanInput = createPriorityDriftSummaryScenarioInput('clean');
const cleanBefore = JSON.stringify(cleanInput);
const safetyInput = createPriorityDriftSummaryScenarioInput('safetyViolation');
assert.equal(safetyInput.simulationAuthorized, true);
assert.equal(cleanInput.simulationAuthorized, false);
assert.equal(JSON.stringify(cleanInput), cleanBefore);
const regressionInput = createPriorityDriftSummaryScenarioInput('diagnosticRegression');
const regression = regressionInput.rows.find(row => row.scenario === 'diagnosticRegression');
assert.equal(regression.highestSeverity, 'critical');
assert(regression.priorityFields.includes('unexpected-priority'));
const orderingInput = createPriorityDriftSummaryScenarioInput('orderingChange');
assert.equal(orderingInput.rows[0].scenario, 'mixedPriority');
const mixedInput = createPriorityDriftSummaryScenarioInput('mixedPriority');
assert.equal(mixedInput.simulationAuthorized, true);
assert.equal(mixedInput.version, cleanInput.version + 1);
assert.equal(mixedInput.rows[0].scenario, 'mixedPriority');
assert.equal(JSON.stringify(cleanInput), cleanBefore);

const matrix = createDiagnosticTriagePriorityDriftSummaryFixtureMatrix();
assert.equal(matrix.kind, 'franchise-diagnostic-triage-priority-drift-summary-fixture-matrix');
assert.equal(matrix.version, 1);
assert.equal(matrix.scenarioCount, 5);
assert.deepEqual(matrix.rows.map(row => row.scenario), PRIORITY_DRIFT_SUMMARY_SCENARIO_NAMES);
assert.deepEqual(matrix.rows.map(row => row.hasDrift), [false, true, true, true, true]);
assert.equal(matrix.rows[0].findingCount, 0);
assert.equal(matrix.rows[0].highestSeverity, null);
assert.deepEqual(matrix.rows[0].severityCounts, { critical: 0, high: 0, medium: 0, low: 0 });
assert.deepEqual(matrix.rows[0].categoryNames, []);
assert.deepEqual(matrix.rows[0].priorityFields, []);
assert.equal(matrix.rows[1].highestSeverity, 'critical');
assert.deepEqual(matrix.rows[1].priorityFields, ['simulationAuthorized']);
assert.equal(matrix.rows[2].highestSeverity, 'high');
assert(matrix.rows[2].priorityFields.includes('highestSeverity'));
assert(matrix.rows[2].priorityFields.includes('severityCounts.high'));
assert(matrix.rows[2].priorityFields.includes('priorityFields'));
assert.equal(matrix.rows[3].highestSeverity, 'medium');
assert(matrix.rows[3].priorityFields.includes('scenarioNames'));
assert.equal(matrix.rows[4].highestSeverity, 'critical');
assert(matrix.rows[4].priorityFields.includes('simulationAuthorized'));
assert(matrix.rows[4].severityCounts.high > 0);
assert(matrix.rows[4].severityCounts.medium > 0);
assert(matrix.rows[4].severityCounts.low > 0);
for (const row of matrix.rows) {
  assert.equal(row.simulationAuthorized, false);
  assert.equal(row.categoryCount, row.categoryNames.length);
  assert.equal(row.findingCount, Object.values(row.severityCounts).reduce((a, b) => a + b, 0));
}
for (const flag of ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed']) {
  assert.equal(matrix[flag], false);
}
const snapshot = JSON.stringify(matrix);
assert.deepEqual(createDiagnosticTriagePriorityDriftSummaryFixtureMatrix(), matrix);
matrix.rows[4].priorityFields.push('TAMPER');
matrix.rows[1].severityCounts.critical = 999;
assert.equal(JSON.stringify(createDiagnosticTriagePriorityDriftSummaryFixtureMatrix()), snapshot);
console.log('Mission 691 priority drift summary fixture matrix tests passed.');
