'use strict';
const assert = require('node:assert/strict');
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
const original = JSON.stringify(universe);
const pipeline = createSimulationRosterReadinessPipeline(universe, { players: [] });
const pipelineBefore = JSON.stringify({
  diagnostics: pipeline.bridge.diagnostics,
  organizationDiagnostics: pipeline.bridge.organizationDiagnostics,
  readiness: pipeline.readiness
});
const summary = createRosterReadinessValidationSummary(pipeline);
assert.equal(JSON.stringify(universe), original);
assert.equal(JSON.stringify({
  diagnostics: pipeline.bridge.diagnostics,
  organizationDiagnostics: pipeline.bridge.organizationDiagnostics,
  readiness: pipeline.readiness
}), pipelineBefore);
assert.equal(summary.kind, 'roster-readiness-validation-summary');
assert.equal(summary.dataQuality.valid, pipeline.bridge.validation.valid);
assert.equal(summary.dataQuality.reportedIssueCount, pipeline.bridge.validation.issueCount);
assert.deepEqual(summary.dataQuality.errors, pipeline.bridge.diagnostics);
assert(summary.warnings.readiness.some(w => w.code === 'NO_CONFIRMED_TEAM_CANDIDATES' && w.teamId === 20));
assert(summary.warnings.readiness.some(w => w.code === 'RETIRED_ASSOCIATED_PLAYERS' && w.teamId === 10));
assert(summary.warnings.readiness.some(w => w.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && w.teamId === -1));
assert(summary.warnings.readiness.some(w => w.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && w.teamId === 3515531));
assert.equal(summary.warnings.count, summary.warnings.organization.length + summary.warnings.readiness.length);
assert.equal(summary.simulationAuthorized, false);
assert.equal(summary.sourceStateMutated, false);
assert.equal(summary.persistencePerformed, false);
summary.warnings.readiness[0].code = 'CHANGED';
assert.equal(pipeline.readiness.teams[0].issues[0], 'RETIRED_ASSOCIATED_PLAYERS');

const clean = createSimulationRosterReadinessPipeline(
  { teams: [{ id: 10 }], players: [{ id: 7, teamId: 10 }] }, { players: [] }
);
const cleanSummary = createRosterReadinessValidationSummary(clean);
assert.equal(cleanSummary.dataQuality.valid, true);
assert.equal(cleanSummary.dataQuality.errors.length, 0);
assert(cleanSummary.warnings.readiness.some(w => w.code === 'ROSTER_REQUIREMENTS_NOT_DEFINED'));
assert.equal(cleanSummary.simulationAuthorized, false);
assert.throws(() => createRosterReadinessValidationSummary({}), { code: 'INVALID_READINESS_VALIDATION_INPUT' });
console.log('Mission 669 readiness validation summary tests passed.');
