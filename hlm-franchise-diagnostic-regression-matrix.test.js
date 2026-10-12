'use strict';
const assert = require('node:assert/strict');
const { DIAGNOSTIC_FIXTURE_NAMES, createDiagnosticFixture } = require('./hlm-franchise-diagnostic-fixtures');
const { createFranchiseDataHealthReport } = require('./hlm-franchise-data-health-report');
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');

const matrix = createFranchiseDiagnosticRegressionMatrix();
assert.equal(matrix.kind, 'franchise-diagnostic-regression-matrix');
assert.equal(matrix.version, 1);
assert.equal(matrix.fixtureCount, 4);
assert.deepEqual(matrix.rows.map(row => row.fixture), DIAGNOSTIC_FIXTURE_NAMES);
assert.equal(matrix.simulationAuthorized, false);
assert.equal(matrix.sourceStateMutated, false);
assert.equal(matrix.persistencePerformed, false);

for (const row of matrix.rows) {
  const { universe, roster } = createDiagnosticFixture(row.fixture);
  const report = createFranchiseDataHealthReport(universe, roster);
  assert.equal(row.dataQualityValid, report.dataQuality.valid);
  assert.equal(row.reportedIssueCount, report.dataQuality.reportedIssueCount);
  assert.deepEqual(row.errorCodes, report.dataQuality.errors.map(issue => issue.code));
  assert.deepEqual(row.organizationWarningCodes, report.warnings.organization.map(issue => issue.code));
  assert.deepEqual(row.readinessWarningCodes, report.warnings.readiness.map(issue => issue.code));
  assert.equal(row.warningCount, report.warnings.count);
  assert.equal(row.teamCount, report.roster.summary.teamCount);
  assert.equal(row.candidateCount, report.roster.summary.candidateCount);
  assert.equal(row.unresolvedPlayerCount, report.roster.summary.unresolvedPlayerCount);
  assert.deepEqual(row.unresolvedByStatus, report.roster.unresolvedByStatus);
  assert.equal(row.simulationAuthorized, false);
}

const clean = matrix.rows.find(row => row.fixture === 'clean');
assert.equal(clean.dataQualityValid, true);
assert.equal(clean.candidateCount, 2);
assert.equal(clean.unresolvedPlayerCount, 0);
assert(clean.readinessWarningCodes.includes('ROSTER_REQUIREMENTS_NOT_DEFINED'));

const invalid = matrix.rows.find(row => row.fixture === 'invalidIdentities');
assert.equal(invalid.dataQualityValid, false);
assert.equal(invalid.candidateCount, 1);
for (const code of ['DUPLICATE_UNIVERSE_PLAYER_ID', 'INVALID_UNIVERSE_PLAYER', 'ROSTER_PLAYER_MISSING_UNIVERSE']) {
  assert(invalid.errorCodes.includes(code), 'missing error: ' + code);
}

const unresolved = matrix.rows.find(row => row.fixture === 'unresolvedOrganizations');
assert.equal(unresolved.dataQualityValid, false);
assert.equal(unresolved.candidateCount, 1);
assert.equal(unresolved.unresolvedPlayerCount, 4);
assert.equal(unresolved.readinessWarningCodes.filter(code => code === 'UNRESOLVED_PLAYER_ORGANIZATION').length, 4);

const mixed = matrix.rows.find(row => row.fixture === 'mixedRoster');
assert.equal(mixed.candidateCount, 2);
assert.equal(mixed.unresolvedPlayerCount, 2);
assert(mixed.readinessWarningCodes.includes('RETIRED_ASSOCIATED_PLAYERS'));

// The matrix is detached from future runs and from fixture source records.
matrix.rows[0].errorCodes.push('TAMPERED');
matrix.rows[0].unresolvedByStatus.injected = 999;
matrix.rows[0].fixture = 'CHANGED';
const fresh = createFranchiseDiagnosticRegressionMatrix();
assert.deepEqual(fresh.rows.map(row => row.fixture), DIAGNOSTIC_FIXTURE_NAMES);
assert(!fresh.rows[0].errorCodes.includes('TAMPERED'));
assert.equal(fresh.rows[0].unresolvedByStatus.injected, undefined);
assert.deepEqual(fresh, createFranchiseDiagnosticRegressionMatrix(), 'deterministic across runs');
console.log('Mission 673 diagnostic regression matrix tests passed.');
