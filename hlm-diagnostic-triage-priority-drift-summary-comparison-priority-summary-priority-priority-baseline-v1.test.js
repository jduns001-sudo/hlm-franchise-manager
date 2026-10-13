'use strict';
const assert = require('node:assert/strict');
const { PRIORITY_SUMMARY_FINAL_EXPECTED_BASELINE_V1: baseline } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-baseline-v1');
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityFixtureMatrix: matrix } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-fixture-matrix');

const names = ['clean','safetyViolation','diagnosticRegression','orderingChange','mixedPriority'];
assert.equal(baseline.kind,
  'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-expected-baseline');
assert.equal(baseline.version, 1);
assert.equal(baseline.matrixVersion, 1);
assert.deepEqual(baseline.scenarioNames, names);
assert.deepEqual(Object.keys(baseline.expectations), names);
for (const flag of ['simulationAuthorized','sourceStateMutated','persistencePerformed']) {
  assert.equal(baseline[flag], false);
}
const expected = [
  [false,0,null,[0,0,0,0],0,[],[],[]],
  [true,1,'critical',[1,0,0,0],1,['safety-invariant'],['simulationAuthorized'],['simulationAuthorized']],
  [true,3,'high',[0,3,0,0],1,['diagnostic-regression'],
    ['highestSeverity','severityCounts.high','priorityFields'],
    ['highestSeverity','severityCounts.high','priorityFields']],
  [true,2,'medium',[0,0,2,0],1,['ordering-or-count'],['scenarioNames','categoryNames'],[]],
  [true,7,'critical',[1,3,2,1],4,
    ['safety-invariant','diagnostic-regression','ordering-or-count','metadata-or-other'],
    ['simulationAuthorized'],
    ['simulationAuthorized','highestSeverity','severityCounts.high','priorityFields']]
];
const extract = row => [
  row.hasDrift,row.findingCount,row.highestSeverity,
  [row.severityCounts.critical,row.severityCounts.high,row.severityCounts.medium,row.severityCounts.low],
  row.categoryCount,row.categoryNames,row.priorityFields,row.urgentFields
];
for (let i=0; i<names.length; i++) {
  const row = baseline.expectations[names[i]];
  assert.deepEqual(extract(row), expected[i]);
  assert.equal(row.simulationAuthorized, false);
}
const observed = matrix();
assert.equal(observed.version, baseline.matrixVersion);
assert.equal(observed.scenarioCount, names.length);
assert.deepEqual(observed.rows.map(row=>row.scenario), baseline.scenarioNames);
for (const row of observed.rows) {
  assert.deepEqual(extract(row), extract(baseline.expectations[row.scenario]));
  assert.equal(row.simulationAuthorized, baseline.expectations[row.scenario].simulationAuthorized);
}
const isDeepFrozen = object => {
  if (object && typeof object === 'object') {
    assert(Object.isFrozen(object), 'Expected deeply frozen object');
    for (const value of Object.values(object)) isDeepFrozen(value);
  }
};
isDeepFrozen(baseline);
const before = JSON.stringify(baseline);
assert.throws(() => baseline.scenarioNames.push('TAMPER'), TypeError);
assert.throws(() => { baseline.expectations.mixedPriority.severityCounts.critical = 999; }, TypeError);
assert.throws(() => baseline.expectations.mixedPriority.urgentFields.push('TAMPER'), TypeError);
assert.throws(() => { baseline.expectations.clean.findingCount = 999; }, TypeError);
assert.equal(JSON.stringify(baseline), before);
observed.rows[4].severityCounts.critical = 999;
observed.rows[4].categoryNames.push('TAMPER');
assert.equal(JSON.stringify(baseline), before);
assert.deepEqual(matrix().rows[4].severityCounts, baseline.expectations.mixedPriority.severityCounts);
assert.strictEqual(require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-baseline-v1')
  .PRIORITY_SUMMARY_FINAL_EXPECTED_BASELINE_V1, baseline);
console.log('Mission 716 independent frozen baseline tests passed.');
