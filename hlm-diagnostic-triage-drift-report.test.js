'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriageFixtureMatrix } = require('./hlm-diagnostic-triage-fixture-matrix');
const { createDiagnosticTriageDriftReport } = require('./hlm-diagnostic-triage-drift-report');

const clean = createDiagnosticTriageDriftReport();
assert.equal(clean.kind, 'franchise-diagnostic-triage-drift-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.deepEqual(clean.findings, []);
assert.equal(clean.simulationAuthorized, false);
assert.equal(clean.sourceStateMutated, false);
assert.equal(clean.persistencePerformed, false);

const matrix = createDiagnosticTriageFixtureMatrix();
const original = JSON.stringify(matrix);
const changed = JSON.parse(original);
const row = name => changed.rows.find(item => item.scenario === name);
row('mixedPriority').severityCounts.high = 9;
row('mixedPriority').highestSeverity = 'high';
row('mixedPriority').categoryNames.reverse();
row('mixedPriority').priorityFields.push('candidateCount');
row('clean').simulationAuthorized = true;
changed.simulationAuthorized = true;
changed.sourceStateMutated = true;
changed.persistencePerformed = true;
const drift = createDiagnosticTriageDriftReport(changed);
assert.equal(drift.hasDrift, true);
assert.equal(drift.findingCount, drift.findings.length);
assert.equal(drift.findingCount, 8);
assert.deepEqual(drift.findings.map(f => [f.scenario, f.field, f.code]), [
  [null, 'simulationAuthorized', 'TRIAGE_SAFETY_INVARIANT_CHANGED'],
  [null, 'sourceStateMutated', 'TRIAGE_SAFETY_INVARIANT_CHANGED'],
  [null, 'persistencePerformed', 'TRIAGE_SAFETY_INVARIANT_CHANGED'],
  ['clean', 'simulationAuthorized', 'TRIAGE_SAFETY_INVARIANT_CHANGED'],
  ['mixedPriority', 'highestSeverity', 'TRIAGE_BASELINE_CHANGED'],
  ['mixedPriority', 'severityCounts.high', 'TRIAGE_SEVERITY_COUNT_CHANGED'],
  ['mixedPriority', 'categoryNames', 'TRIAGE_CATEGORY_ORDER_CHANGED'],
  ['mixedPriority', 'priorityFields', 'TRIAGE_PRIORITY_ORDER_CHANGED']
]);
assert.equal(drift.simulationAuthorized, false);
assert.equal(drift.sourceStateMutated, false);
assert.equal(drift.persistencePerformed, false);
assert.equal(JSON.stringify(matrix), original, 'canonical fixture matrix remains unchanged');
const snapshot = JSON.stringify(changed);
assert.equal(JSON.stringify(changed), snapshot, 'reporter must not mutate input');
drift.findings.find(f => f.field === 'categoryNames').expected.push('TAMPERED');
drift.findings.find(f => f.field === 'priorityFields').actual.push('TAMPERED');
assert.equal(JSON.stringify(changed), snapshot, 'output arrays must not alias input');
const again = createDiagnosticTriageDriftReport(changed);
assert(!again.findings.some(f => JSON.stringify(f).includes('TAMPERED')));

const missing = createDiagnosticTriageFixtureMatrix();
missing.rows.pop();
const missingReport = createDiagnosticTriageDriftReport(missing);
assert(missingReport.findings.some(f => f.code === 'TRIAGE_SCENARIO_ORDER_CHANGED'));
assert(missingReport.findings.some(f => f.code === 'TRIAGE_SCENARIO_MISSING_OR_DUPLICATED'));
const duplicate = createDiagnosticTriageFixtureMatrix();
duplicate.rows.push({ ...duplicate.rows[0] });
assert( createDiagnosticTriageDriftReport(duplicate).findings.some(f => f.code === 'TRIAGE_SCENARIO_MISSING_OR_DUPLICATED'));
const reordered = createDiagnosticTriageFixtureMatrix();
reordered.rows.reverse();
assert(createDiagnosticTriageDriftReport(reordered).findings.some(f => f.code === 'TRIAGE_SCENARIO_ORDER_CHANGED'));
assert.throws(() => createDiagnosticTriageDriftReport(null), { code: 'INVALID_TRIAGE_FIXTURE_MATRIX' });
assert.throws(() => createDiagnosticTriageDriftReport({ rows: null }), { code: 'INVALID_TRIAGE_FIXTURE_MATRIX' });
console.log('Mission 681 diagnostic triage drift report tests passed.');
