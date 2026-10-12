'use strict';
const assert = require('node:assert/strict');
const { createFranchiseDiagnosticRegressionMatrix } = require('./hlm-franchise-diagnostic-regression-matrix');
const { createFranchiseDiagnosticDriftReport } = require('./hlm-franchise-diagnostic-drift-report');
const { createDiagnosticDriftSeverityReport } = require('./hlm-diagnostic-drift-severity');
const { createDiagnosticTriageSummary } = require('./hlm-diagnostic-triage-summary');
const {
  TRIAGE_SCENARIO_NAMES, createTriageScenarioMatrix, createDiagnosticTriageFixtureMatrix
} = require('./hlm-diagnostic-triage-fixture-matrix');

assert(Object.isFrozen(TRIAGE_SCENARIO_NAMES));
assert.deepEqual(TRIAGE_SCENARIO_NAMES, [
  'clean', 'simulationAuthorization', 'missingCanonicalDiagnostic',
  'rosterCountChange', 'metadataVersionChange', 'mixedPriority'
]);
const pristine = createFranchiseDiagnosticRegressionMatrix();
const pristineJSON = JSON.stringify(pristine);
const matrix = createDiagnosticTriageFixtureMatrix();
assert.equal(matrix.kind, 'franchise-diagnostic-triage-fixture-matrix');
assert.equal(matrix.version, 1);
assert.equal(matrix.scenarioCount, 6);
assert.deepEqual(matrix.rows.map(row => row.scenario), TRIAGE_SCENARIO_NAMES);
assert.equal(matrix.simulationAuthorized, false);
assert.equal(matrix.sourceStateMutated, false);
assert.equal(matrix.persistencePerformed, false);
assert.equal(JSON.stringify(createFranchiseDiagnosticRegressionMatrix()), pristineJSON);

const expected = {
  clean: [false, null, { critical: 0, high: 0, medium: 0, low: 0 }],
  simulationAuthorization: [true, 'critical', { critical: 1, high: 0, medium: 0, low: 0 }],
  missingCanonicalDiagnostic: [true, 'high', { critical: 0, high: 3, medium: 0, low: 0 }],
  rosterCountChange: [true, 'medium', { critical: 0, high: 0, medium: 1, low: 0 }],
  metadataVersionChange: [true, 'low', { critical: 0, high: 0, medium: 0, low: 1 }],
  mixedPriority: [true, 'critical', { critical: 1, high: 3, medium: 1, low: 1 }]
};
for (const row of matrix.rows) {
  const [hasDrift, highestSeverity, counts] = expected[row.scenario];
  assert.equal(row.hasDrift, hasDrift, row.scenario);
  assert.equal(row.highestSeverity, highestSeverity, row.scenario);
  assert.deepEqual(row.severityCounts, counts, row.scenario);
  assert.equal(row.driftCount, Object.values(counts).reduce((a, b) => a + b, 0));
  assert.equal(row.simulationAuthorized, false);
  const scenario = createTriageScenarioMatrix(row.scenario);
  const before = JSON.stringify(scenario);
  const drift = createFranchiseDiagnosticDriftReport(scenario);
  const severity = createDiagnosticDriftSeverityReport(drift);
  const triage = createDiagnosticTriageSummary(severity);
  assert.equal(row.driftCount, drift.changeCount);
  assert.deepEqual(row.severityCounts, triage.counts);
  assert.deepEqual(row.categoryNames, triage.groups.map(group => group.category));
  assert.deepEqual(row.priorityFields, triage.priorityFindings.map(finding => finding.field));
  assert.equal(row.categoryCount, triage.categoryCount);
  assert.equal(JSON.stringify(scenario), before, 'scenario input not mutated');
}
assert.deepEqual(matrix.rows.find(row => row.scenario === 'mixedPriority').priorityFields, ['simulationAuthorized']);
assert.deepEqual(matrix.rows.find(row => row.scenario === 'clean').priorityFields, []);
assert.throws(() => createTriageScenarioMatrix('not-a-scenario'), { code: 'UNKNOWN_TRIAGE_SCENARIO' });

const isolated = createTriageScenarioMatrix('mixedPriority');
isolated.rows[0].candidateCount = 999;
assert.equal(JSON.stringify(createFranchiseDiagnosticRegressionMatrix()), pristineJSON, 'base fixture matrix unchanged');
matrix.rows[0].categoryNames.push('TAMPERED');
matrix.rows[1].severityCounts.critical = 999;
const fresh = createDiagnosticTriageFixtureMatrix();
assert(!fresh.rows[0].categoryNames.includes('TAMPERED'));
assert.equal(fresh.rows[1].severityCounts.critical, 1);
assert.deepEqual(fresh, createDiagnosticTriageFixtureMatrix(), 'deterministic fresh output');
console.log('Mission 679 diagnostic triage fixture matrix tests passed.');
