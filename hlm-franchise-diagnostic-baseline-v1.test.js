'use strict';
const assert = require('node:assert/strict');
const { FRANCHISE_DIAGNOSTIC_BASELINE_V1: baseline } = require('./hlm-franchise-diagnostic-baseline-v1');
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');
const { DIAGNOSTIC_FIXTURE_NAMES } = require('./hlm-franchise-diagnostic-fixtures');

function compareToBaseline(matrix) {
  const failures = [];
  if (matrix.kind !== 'franchise-diagnostic-regression-matrix') failures.push('matrix kind changed');
  if (matrix.version !== baseline.matrixVersion) failures.push('matrix version changed');
  if (matrix.fixtureCount !== baseline.fixtureNames.length) failures.push('fixture count changed');
  if (matrix.simulationAuthorized !== false) failures.push('simulation authorization changed');
  if (matrix.sourceStateMutated !== false) failures.push('source mutation flag changed');
  if (matrix.persistencePerformed !== false) failures.push('persistence flag changed');
  if (JSON.stringify(matrix.rows.map(row => row.fixture)) !== JSON.stringify(baseline.fixtureNames)) {
    failures.push('fixture order or names changed');
  }
  for (const name of baseline.fixtureNames) {
    const row = matrix.rows.find(item => item.fixture === name);
    if (!row) { failures.push(name + ': missing row'); continue; }
    const expected = baseline.expectations[name];
    for (const field of ['dataQualityValid', 'teamCount', 'candidateCount', 'unresolvedPlayerCount']) {
      if (Object.prototype.hasOwnProperty.call(expected, field) && row[field] !== expected[field]) {
        failures.push(name + ': ' + field + ' expected ' + expected[field] + ', got ' + row[field]);
      }
    }
    for (const code of expected.requiredErrorCodes) {
      if (!row.errorCodes.includes(code)) failures.push(name + ': missing canonical error ' + code);
    }
    for (const code of expected.requiredReadinessCodes) {
      if (!row.readinessWarningCodes.includes(code)) failures.push(name + ': missing readiness warning ' + code);
    }
    if (Object.prototype.hasOwnProperty.call(expected, 'unresolvedOrganizationWarningCount')) {
      const count = row.readinessWarningCodes.filter(code => code === 'UNRESOLVED_PLAYER_ORGANIZATION').length;
      if (count !== expected.unresolvedOrganizationWarningCount) failures.push(name + ': unresolved organization warning count changed');
    }
    if (row.simulationAuthorized !== false) failures.push(name + ': simulation authorized');
  }
  return failures;
}

assert.equal(baseline.kind, 'franchise-diagnostic-expected-baseline');
assert.equal(baseline.version, 1);
assert(Object.isFrozen(baseline));
assert.deepEqual(baseline.fixtureNames, DIAGNOSTIC_FIXTURE_NAMES);
assert.deepEqual(compareToBaseline(createFranchiseDiagnosticRegressionMatrix()), [], 'current matrix must match baseline v1');
assert.deepEqual(compareToBaseline(createFranchiseDiagnosticRegressionMatrix()), [], 'repeat runs must match baseline v1');

// Regression guard: the comparator must actually reject altered diagnostics,
// counts, authorization, and fixture order.
const altered = createFranchiseDiagnosticRegressionMatrix();
altered.rows[0].candidateCount += 1;
assert(compareToBaseline(altered).some(message => message.includes('candidateCount')));
const removed = createFranchiseDiagnosticRegressionMatrix();
removed.rows[1].errorCodes = [];
assert(compareToBaseline(removed).some(message => message.includes('DUPLICATE_UNIVERSE_PLAYER_ID')));
const authorized = createFranchiseDiagnosticRegressionMatrix();
authorized.rows[2].simulationAuthorized = true;
assert(compareToBaseline(authorized).some(message => message.includes('simulation authorized')));
const reordered = createFranchiseDiagnosticRegressionMatrix();
reordered.rows.reverse();
assert(compareToBaseline(reordered).some(message => message.includes('fixture order')));
console.log('Mission 674 diagnostic expected baseline v1 tests passed.');
