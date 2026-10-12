'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticTriagePriorityFixtureMatrix } = require('./hlm-diagnostic-triage-priority-fixture-matrix');
const { PRIORITY_EXPECTED_BASELINE_V1 } = require('./hlm-diagnostic-triage-priority-baseline-v1');
const { createDiagnosticTriagePriorityDriftReport } = require('./hlm-diagnostic-triage-priority-drift-report');

const clean = createDiagnosticTriagePriorityDriftReport();
assert.equal(clean.kind, 'franchise-diagnostic-triage-priority-drift-report');
assert.equal(clean.version, 1);
assert.equal(clean.baselineVersion, 1);
assert.equal(clean.matrixVersion, 1);
assert.equal(clean.hasDrift, false);
assert.equal(clean.findingCount, 0);
assert.deepEqual(clean.findings, []);
assert.equal(clean.simulationAuthorized, false);
assert.equal(clean.sourceStateMutated, false);
assert.equal(clean.persistencePerformed, false);

const matrix = createDiagnosticTriagePriorityFixtureMatrix();
matrix.simulationAuthorized = true;
matrix.sourceStateMutated = true;
matrix.persistencePerformed = true;
matrix.version += 1;
matrix.rows.find(row => row.scenario === 'safetyViolation').simulationAuthorized = true;
const regression = matrix.rows.find(row => row.scenario === 'diagnosticRegression');
regression.highestSeverity = 'critical';
regression.severityCounts.high += 1;
regression.priorityFields.push('newPriority');
const ordering = matrix.rows.find(row => row.scenario === 'orderingChange');
ordering.categoryNames.reverse(); // one-item array remains unchanged
ordering.categoryNames.push('unexpected-category');
const mixed = matrix.rows.find(row => row.scenario === 'mixedPriority');
mixed.findingCount += 1;
mixed.categoryCount += 1;
const before = JSON.stringify(matrix);
const baselineBefore = JSON.stringify(PRIORITY_EXPECTED_BASELINE_V1);
const drift = createDiagnosticTriagePriorityDriftReport(matrix);
assert.equal(drift.hasDrift, true);
assert.equal(drift.findingCount, 12);
assert.deepEqual(drift.findings.map(f => [f.scenario, f.field]), [
  [null, 'version'],
  [null, 'simulationAuthorized'],
  [null, 'sourceStateMutated'],
  [null, 'persistencePerformed'],
  ['safetyViolation', 'simulationAuthorized'],
  ['diagnosticRegression', 'highestSeverity'],
  ['diagnosticRegression', 'severityCounts.high'],
  ['diagnosticRegression', 'priorityFields'],
  ['orderingChange', 'categoryNames'],
  ['mixedPriority', 'findingCount'],
  ['mixedPriority', 'categoryCount']
].slice(0, 11));
assert.equal(drift.findingCount, drift.findings.length);
assert.equal(drift.findings[1].code, 'PRIORITY_SAFETY_INVARIANT_CHANGED');
assert.equal(drift.findings[6].code, 'PRIORITY_SEVERITY_COUNT_CHANGED');
assert.equal(drift.findings[7].code, 'PRIORITY_FIELD_ORDER_CHANGED');
assert.equal(drift.findings[8].code, 'PRIORITY_CATEGORY_ORDER_CHANGED');
assert.equal(drift.simulationAuthorized, false);
assert.equal(drift.sourceStateMutated, false);
assert.equal(drift.persistencePerformed, false);
assert.equal(JSON.stringify(matrix), before, 'input unchanged');
assert.equal(JSON.stringify(PRIORITY_EXPECTED_BASELINE_V1), baselineBefore, 'baseline unchanged');
assert.deepEqual(createDiagnosticTriagePriorityDriftReport(matrix), drift, 'deterministic');

drift.findings[7].actual.push('TAMPER');
assert.equal(JSON.stringify(matrix), before, 'findings must detach arrays from input');
assert(!JSON.stringify(createDiagnosticTriagePriorityDriftReport(matrix)).includes('TAMPER'));

const changed = createDiagnosticTriagePriorityFixtureMatrix();
changed.rows.reverse();
changed.rows.pop();
changed.rows.push({ ...changed.rows[0], scenario: 'safetyViolation' });
changed.scenarioCount = changed.rows.length;
const structure = createDiagnosticTriagePriorityDriftReport(changed);
assert(structure.findings.some(f => f.field === 'scenarioNames'));
assert(structure.findings.some(f => f.code === 'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED'));
assert(structure.findings.some(f => f.scenario === 'clean' && f.field === 'scenario'));
assert(structure.findings.some(f => f.scenario === 'safetyViolation' && f.field === 'scenario'));

const counts = createDiagnosticTriagePriorityFixtureMatrix();
counts.rows.find(row => row.scenario === 'clean').severityCounts.critical = 1;
counts.rows.find(row => row.scenario === 'clean').categoryNames = null;
assert(createDiagnosticTriagePriorityDriftReport(counts).findings.some(f => f.field === 'severityCounts.critical'));
assert(createDiagnosticTriagePriorityDriftReport(counts).findings.some(f => f.field === 'categoryNames'));

assert.throws(() => createDiagnosticTriagePriorityDriftReport(null), { code: 'INVALID_PRIORITY_FIXTURE_MATRIX' });
assert.throws(() => createDiagnosticTriagePriorityDriftReport({ rows: 'bad' }), { code: 'INVALID_PRIORITY_FIXTURE_MATRIX' });
console.log('Mission 687 triage priority drift report tests passed.');
