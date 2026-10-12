'use strict';
const assert = require('node:assert/strict');
const { createDiagnosticFixture, DIAGNOSTIC_FIXTURE_NAMES } = require('./hlm-franchise-diagnostic-fixtures');
const { createFranchiseDataHealthReport } = require('./hlm-franchise-data-health-report');
const { createSimulationRosterReadinessPipeline } = require('./hlm-simulation-roster-readiness-pipeline');
const { createRosterReadinessValidationSummary } = require('./hlm-roster-readiness-validation-summary');

assert.deepEqual(DIAGNOSTIC_FIXTURE_NAMES, ['clean', 'invalidIdentities', 'unresolvedOrganizations', 'mixedRoster']);
assert(Object.isFrozen(DIAGNOSTIC_FIXTURE_NAMES));
assert.throws(() => createDiagnosticFixture('unknown'), { code: 'UNKNOWN_DIAGNOSTIC_FIXTURE' });

for (const name of DIAGNOSTIC_FIXTURE_NAMES) {
  const fixture = createDiagnosticFixture(name);
  const original = JSON.stringify(fixture);
  const report = createFranchiseDataHealthReport(fixture.universe, fixture.roster);
  const pipeline = createSimulationRosterReadinessPipeline(fixture.universe, fixture.roster);
  const summary = createRosterReadinessValidationSummary(pipeline);
  assert.deepEqual(report.dataQuality, summary.dataQuality, name + ': canonical errors preserved');
  assert.deepEqual(report.warnings, summary.warnings, name + ': warnings preserved');
  assert.deepEqual(report.roster.summary, pipeline.readiness.summary, name + ': readiness preserved');
  assert.equal(report.simulationAuthorized, false);
  assert.equal(report.persistencePerformed, false);
  assert.equal(report.sourceStateMutated, false);
  assert.equal(JSON.stringify(fixture), original, name + ': fixture not mutated by report');
  // Each fixture call must return a new, independent data tree.
  fixture.universe.teams[0].name = 'CHANGED';
  assert.notEqual(createDiagnosticFixture(name).universe.teams[0].name, 'CHANGED');
}

const clean = createDiagnosticFixture('clean');
const cleanReport = createFranchiseDataHealthReport(clean.universe, clean.roster);
assert.equal(cleanReport.dataQuality.valid, true);
assert.equal(cleanReport.dataQuality.errors.length, 0);
assert.equal(cleanReport.roster.summary.candidateCount, 2);
assert.equal(cleanReport.roster.summary.unresolvedPlayerCount, 0);
assert(cleanReport.warnings.readiness.some(w => w.code === 'ROSTER_REQUIREMENTS_NOT_DEFINED'));

const invalid = createDiagnosticFixture('invalidIdentities');
const invalidReport = createFranchiseDataHealthReport(invalid.universe, invalid.roster);
assert.equal(invalidReport.dataQuality.valid, false);
assert(invalidReport.dataQuality.errors.some(issue => issue.code === 'DUPLICATE_UNIVERSE_PLAYER_ID'));
assert(invalidReport.dataQuality.errors.some(issue => issue.code === 'INVALID_UNIVERSE_PLAYER'));
assert(invalidReport.dataQuality.errors.some(issue => issue.code === 'ROSTER_PLAYER_MISSING_UNIVERSE'));
assert.equal(invalidReport.roster.summary.candidateCount, 1, 'duplicate ID must not double count');

const unresolved = createDiagnosticFixture('unresolvedOrganizations');
const unresolvedReport = createFranchiseDataHealthReport(unresolved.universe, unresolved.roster);
assert.equal(unresolvedReport.roster.summary.candidateCount, 1);
assert.equal(unresolvedReport.roster.summary.unresolvedPlayerCount, 4);
for (const teamId of [3515531, -1, 0, 100]) {
  assert(unresolvedReport.warnings.readiness.some(w =>
    w.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && w.teamId === teamId));
}

const mixed = createDiagnosticFixture('mixedRoster');
const mixedReport = createFranchiseDataHealthReport(mixed.universe, mixed.roster);
assert.equal(mixedReport.roster.summary.candidateCount, 2);
assert.equal(mixedReport.roster.summary.unresolvedPlayerCount, 2);
assert.equal(mixedReport.roster.teams.find(t => t.teamId === 10).excludedCount, 1);
assert(mixedReport.warnings.readiness.some(w => w.code === 'RETIRED_ASSOCIATED_PLAYERS'));
assert.equal(mixedReport.simulationAuthorized, false);
console.log('Mission 672 diagnostic fixture tests passed.');
