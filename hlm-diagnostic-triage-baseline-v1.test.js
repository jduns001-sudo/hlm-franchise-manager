'use strict';
const assert = require('node:assert/strict');
const { TRIAGE_EXPECTED_BASELINE_V1: baseline } = require('./hlm-diagnostic-triage-baseline-v1');
const { createDiagnosticTriageFixtureMatrix } = require('./hlm-diagnostic-triage-fixture-matrix');

assert(Object.isFrozen(baseline));
assert(Object.isFrozen(baseline.scenarioNames));
assert(Object.isFrozen(baseline.expectations));
assert.equal(baseline.kind, 'franchise-diagnostic-triage-expected-baseline');
assert.equal(baseline.version, 1);
assert.equal(baseline.matrixVersion, 1);
assert.equal(baseline.simulationAuthorized, false);
assert.equal(baseline.sourceStateMutated, false);
assert.equal(baseline.persistencePerformed, false);

const actual = createDiagnosticTriageFixtureMatrix();
assert.equal(actual.kind, 'franchise-diagnostic-triage-fixture-matrix');
assert.equal(actual.version, baseline.matrixVersion);
assert.equal(actual.scenarioCount, baseline.scenarioNames.length);
assert.deepEqual(actual.rows.map(row => row.scenario), baseline.scenarioNames);
for (const row of actual.rows) {
  const expected = baseline.expectations[row.scenario];
  assert(expected, 'baseline exists for ' + row.scenario);
  assert(Object.isFrozen(expected));
  assert(Object.isFrozen(expected.severityCounts));
  assert(Object.isFrozen(expected.categoryNames));
  assert(Object.isFrozen(expected.priorityFields));
  assert.equal(row.hasDrift, expected.hasDrift, row.scenario);
  assert.equal(row.driftCount, expected.driftCount, row.scenario);
  assert.equal(row.highestSeverity, expected.highestSeverity, row.scenario);
  assert.deepEqual(row.severityCounts, expected.severityCounts, row.scenario);
  assert.deepEqual(row.categoryNames, expected.categoryNames, row.scenario);
  assert.equal(row.categoryCount, expected.categoryNames.length, row.scenario);
  assert.deepEqual(row.priorityFields, expected.priorityFields, row.scenario);
  assert.equal(row.simulationAuthorized, false);
}
assert.equal(actual.simulationAuthorized, false);
assert.equal(actual.sourceStateMutated, false);
assert.equal(actual.persistencePerformed, false);

function matchesBaseline(matrix) {
  if (matrix.kind !== 'franchise-diagnostic-triage-fixture-matrix' ||
      matrix.version !== baseline.matrixVersion ||
      matrix.scenarioCount !== baseline.scenarioNames.length ||
      JSON.stringify(matrix.rows.map(row => row.scenario)) !== JSON.stringify(baseline.scenarioNames) ||
      matrix.simulationAuthorized !== false || matrix.sourceStateMutated !== false ||
      matrix.persistencePerformed !== false) return false;
  return matrix.rows.every(row => {
    const expected = baseline.expectations[row.scenario];
    return expected && row.hasDrift === expected.hasDrift &&
      row.driftCount === expected.driftCount &&
      row.highestSeverity === expected.highestSeverity &&
      JSON.stringify(row.severityCounts) === JSON.stringify(expected.severityCounts) &&
      JSON.stringify(row.categoryNames) === JSON.stringify(expected.categoryNames) &&
      row.categoryCount === expected.categoryNames.length &&
      JSON.stringify(row.priorityFields) === JSON.stringify(expected.priorityFields) &&
      row.simulationAuthorized === false;
  });
}
assert(matchesBaseline(actual));
const alter = callback => {
  const changed = JSON.parse(JSON.stringify(actual));
  callback(changed);
  assert.equal(matchesBaseline(changed), false);
};
alter(m => { m.rows[0].severityCounts.high = 1; });
alter(m => { m.rows[1].highestSeverity = 'high'; });
alter(m => { m.rows[5].categoryNames.reverse(); });
alter(m => { m.rows[2].priorityFields.reverse(); m.rows[2].priorityFields[0] = 'candidateCount'; });
alter(m => { m.rows.reverse(); });
alter(m => { m.rows[0].simulationAuthorized = true; });
alter(m => { m.simulationAuthorized = true; });
alter(m => { m.sourceStateMutated = true; });
alter(m => { m.persistencePerformed = true; });
assert.deepEqual(createDiagnosticTriageFixtureMatrix(), actual, 'tests must not alter generated scenarios');
console.log('Mission 680 diagnostic triage baseline tests passed.');
