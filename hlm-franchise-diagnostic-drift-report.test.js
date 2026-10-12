'use strict';
const assert = require('node:assert/strict');
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');
const { createFranchiseDiagnosticDriftReport } = require('./hlm-franchise-diagnostic-drift-report');

const pristine = createFranchiseDiagnosticRegressionMatrix();
const original = JSON.stringify(pristine);
const clean = createFranchiseDiagnosticDriftReport(pristine);
assert.equal(clean.kind, 'franchise-diagnostic-drift-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.changeCount, 0);
assert.deepEqual(clean.changes, []);
assert.equal(JSON.stringify(pristine), original, 'input not mutated');
assert.equal(clean.simulationAuthorized, false);
assert.equal(clean.sourceStateMutated, false);
assert.equal(clean.persistencePerformed, false);
assert.deepEqual(createFranchiseDiagnosticDriftReport(), clean);

const altered = createFranchiseDiagnosticRegressionMatrix();
altered.rows[0].candidateCount = 99;
altered.rows[1].errorCodes = [];
altered.rows[2].readinessWarningCodes = [];
altered.rows[3].simulationAuthorized = true;
altered.simulationAuthorized = true;
const snapshot = JSON.stringify(altered);
const drift = createFranchiseDiagnosticDriftReport(altered);
assert.equal(drift.hasDrift, true);
assert.equal(drift.changeCount, drift.changes.length);
assert(drift.changes.some(c => c.fixture === 'clean' && c.field === 'candidateCount' && c.expected === 2 && c.actual === 99));
assert(drift.changes.some(c => c.fixture === 'invalidIdentities' && c.code === 'REQUIRED_DIAGNOSTIC_MISSING' && c.expected === 'DUPLICATE_UNIVERSE_PLAYER_ID'));
assert(drift.changes.some(c => c.fixture === 'unresolvedOrganizations' && c.field === 'unresolvedOrganizationWarningCount'));
assert(drift.changes.some(c => c.fixture === 'mixedRoster' && c.code === 'SIMULATION_AUTHORIZATION_CHANGED'));
assert(drift.changes.some(c => c.fixture === null && c.field === 'simulationAuthorized'));
assert.equal(JSON.stringify(altered), snapshot, 'drift comparison does not mutate input');
assert.equal(drift.simulationAuthorized, false);

const missing = createFranchiseDiagnosticRegressionMatrix();
missing.rows.splice(1, 1);
const missingReport = createFranchiseDiagnosticDriftReport(missing);
assert(missingReport.changes.some(c => c.code === 'FIXTURE_ORDER_CHANGED'));
assert(missingReport.changes.some(c => c.code === 'FIXTURE_MISSING_OR_DUPLICATED' && c.fixture === 'invalidIdentities'));

const optional = createFranchiseDiagnosticRegressionMatrix();
optional.rows[0].readinessWarningCodes.push('NEW_ADVISORY_WARNING');
optional.rows[0].errorCodes.push('NEW_ADVISORY_ERROR');
assert.equal(createFranchiseDiagnosticDriftReport(optional).hasDrift, false, 'unrequired codes are not pinned by v1');
assert.throws(() => createFranchiseDiagnosticDriftReport(null), { code: 'INVALID_DIAGNOSTIC_MATRIX' });
assert.throws(() => createFranchiseDiagnosticDriftReport({}), { code: 'INVALID_DIAGNOSTIC_MATRIX' });

drift.changes[0].field = 'TAMPERED';
assert.equal(createFranchiseDiagnosticDriftReport(altered).changes.some(c => c.field === 'TAMPERED'), false);
console.log('Mission 675 diagnostic drift reporter tests passed.');
