'use strict';

/**
 * Mission 675: descriptive drift against the independently authored v1
 * baseline. Optional advisory codes are not treated as baseline violations.
 */
const { FRANCHISE_DIAGNOSTIC_BASELINE_V1 } = require('./hlm-franchise-diagnostic-baseline-v1');
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');

function createFranchiseDiagnosticDriftReport(matrix = createFranchiseDiagnosticRegressionMatrix()) {
  const baseline = FRANCHISE_DIAGNOSTIC_BASELINE_V1;
  if (!matrix || !Array.isArray(matrix.rows)) {
    const error = new TypeError('A diagnostic regression matrix with rows is required');
    error.code = 'INVALID_DIAGNOSTIC_MATRIX';
    throw error;
  }
  const changes = [];
  function record(fixture, field, expected, actual, code = 'BASELINE_VALUE_CHANGED') {
    changes.push({ fixture, field, expected, actual, code });
  }
  for (const [field, expected] of Object.entries({
    kind: 'franchise-diagnostic-regression-matrix',
    version: baseline.matrixVersion,
    fixtureCount: baseline.fixtureNames.length,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  })) {
    if (matrix[field] !== expected) record(null, field, expected, matrix[field]);
  }
  const names = matrix.rows.map(row => row && row.fixture);
  if (JSON.stringify(names) !== JSON.stringify(baseline.fixtureNames)) {
    record(null, 'fixtureNames', [...baseline.fixtureNames], names, 'FIXTURE_ORDER_CHANGED');
  }
  for (const name of baseline.fixtureNames) {
    const matching = matrix.rows.filter(row => row && row.fixture === name);
    if (matching.length !== 1) {
      record(name, 'fixture', 1, matching.length, 'FIXTURE_MISSING_OR_DUPLICATED');
      continue;
    }
    const row = matching[0];
    const expected = baseline.expectations[name];
    for (const field of ['dataQualityValid', 'teamCount', 'candidateCount', 'unresolvedPlayerCount']) {
      if (Object.prototype.hasOwnProperty.call(expected, field) && row[field] !== expected[field]) {
        record(name, field, expected[field], row[field]);
      }
    }
    for (const [field, required] of [
      ['errorCodes', expected.requiredErrorCodes],
      ['readinessWarningCodes', expected.requiredReadinessCodes]
    ]) {
      const actual = Array.isArray(row[field]) ? row[field] : [];
      for (const code of required) {
        if (!actual.includes(code)) record(name, field, code, null, 'REQUIRED_DIAGNOSTIC_MISSING');
      }
    }
    if (Object.prototype.hasOwnProperty.call(expected, 'unresolvedOrganizationWarningCount')) {
      const actual = Array.isArray(row.readinessWarningCodes)
        ? row.readinessWarningCodes.filter(code => code === 'UNRESOLVED_PLAYER_ORGANIZATION').length
        : 0;
      if (actual !== expected.unresolvedOrganizationWarningCount) {
        record(name, 'unresolvedOrganizationWarningCount', expected.unresolvedOrganizationWarningCount, actual);
      }
    }
    if (row.simulationAuthorized !== false) record(name, 'simulationAuthorized', false, row.simulationAuthorized, 'SIMULATION_AUTHORIZATION_CHANGED');
  }
  return {
    kind: 'franchise-diagnostic-drift-report',
    version: 1,
    baselineVersion: baseline.version,
    matrixVersion: matrix.version,
    hasDrift: changes.length > 0,
    changeCount: changes.length,
    changes,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createFranchiseDiagnosticDriftReport };
