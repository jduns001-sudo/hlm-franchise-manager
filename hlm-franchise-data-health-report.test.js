'use strict';
const assert = require('node:assert/strict');
const { createFranchiseDataHealthReport } = require('./hlm-franchise-data-health-report');
const { createSimulationRosterReadinessPipeline } = require('./hlm-simulation-roster-readiness-pipeline');
const { createRosterReadinessValidationSummary } = require('./hlm-roster-readiness-validation-summary');

const universe = {
  teams: [{ id: 10, name: 'Wolves' }, { id: 20, name: 'Falcons' }],
  players: [
    { id: 1, teamId: 10 },
    { id: 2, teamId: 10, retired: true },
    { id: 3, teamId: -1 },
    { id: 4, teamId: 3515531 }
  ]
};
const roster = { players: [] };
const before = JSON.stringify({ universe, roster });
const report = createFranchiseDataHealthReport(universe, roster);
const pipeline = createSimulationRosterReadinessPipeline(universe, roster);
const validation = createRosterReadinessValidationSummary(pipeline);
assert.equal(JSON.stringify({ universe, roster }), before);
assert.equal(report.kind, 'franchise-data-health-report');
assert.deepEqual(report.dataQuality, validation.dataQuality);
assert.deepEqual(report.warnings, validation.warnings);
assert.deepEqual(report.roster.summary, pipeline.readiness.summary);
assert.deepEqual(report.roster.unresolvedByStatus, pipeline.readiness.unresolvedByStatus);
assert.equal(report.roster.teams.length, 2);
assert.equal(report.roster.teams[0].candidateCount, 1);
assert.equal(report.roster.teams[0].excludedCount, 1);
assert.equal(report.roster.teams[1].candidateCount, 0);
assert(report.roster.teams[1].issues.includes('NO_CONFIRMED_TEAM_CANDIDATES'));
assert(report.warnings.readiness.some(w => w.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && w.teamId === 3515531));
assert.equal(report.roster.teams[0].gameReady, null);
assert.equal(report.roster.teams[0].rosterSufficiency, 'unknown');
assert.equal(report.simulationAuthorized, false);
assert.equal(report.sourceStateMutated, false);
assert.equal(report.persistencePerformed, false);

const clean = createFranchiseDataHealthReport(
  { teams: [{ id: 10, name: 'Wolves' }], players: [{ id: 7, teamId: 10 }] },
  { players: [] }
);
assert.equal(clean.dataQuality.valid, true);
assert.equal(clean.dataQuality.errors.length, 0);
assert(clean.warnings.readiness.some(w => w.code === 'ROSTER_REQUIREMENTS_NOT_DEFINED'));
assert.equal(clean.simulationAuthorized, false);

const isolated = createFranchiseDataHealthReport(universe, roster);
isolated.roster.teams[0].issues.push('CHANGED');
isolated.warnings.readiness[0].code = 'CHANGED';
assert(!report.roster.teams[0].issues.includes('CHANGED'));
assert.notEqual(report.warnings.readiness[0].code, 'CHANGED');
assert.equal(JSON.stringify({ universe, roster }), before);
console.log('Mission 670 franchise data health report tests passed.');
