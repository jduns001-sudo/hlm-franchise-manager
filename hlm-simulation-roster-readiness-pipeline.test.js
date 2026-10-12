'use strict';
const assert = require('node:assert/strict');
const { createCanonicalFranchiseBridgeSnapshot } = require('./hlm-canonical-franchise-bridge');
const { assessSimulationRosterEligibility } = require('./hlm-simulation-roster-eligibility');
const { createSimulationRosterReadinessReport } = require('./hlm-simulation-roster-readiness');
const { createSimulationRosterReadinessPipeline } = require('./hlm-simulation-roster-readiness-pipeline');

const universe = {
  teams: [{ id: 10, name: 'Wolves' }, { id: 20, name: 'Falcons' }],
  players: [
    { id: 1, teamId: 10, retired: false },
    { id: 2, teamId: 10, retired: true },
    { id: 3, teamId: -1, retired: false },
    { id: 4, teamId: 3515531, retired: false },
    { id: 5, teamId: 0, retired: false },
    { id: 6, teamId: 100, retired: false }
  ]
};
const roster = { players: [{ id: 1, teamId: 20 }, { id: 1, teamId: 20 }] };
const options = { playerOverrides: { 3: { teamId: 20 } } };
const before = JSON.stringify({ universe, roster, options });
const result = createSimulationRosterReadinessPipeline(universe, roster, options);
assert.equal(JSON.stringify({ universe, roster, options }), before);
assert.equal(result.kind, 'simulation-roster-readiness-pipeline');
assert.equal(result.bridge.kind, 'canonical-franchise-bridge-snapshot');
assert.equal(result.eligibility.kind, 'simulation-roster-eligibility-assessment');
assert.equal(result.readiness.kind, 'simulation-roster-readiness-report');
assert.equal(result.bridge.players.length, 6, 'historical rows are not canonical players');
assert.equal(result.bridge.players[0].teamId, 10, 'historical roster cannot override canonical membership');
assert.equal(result.bridge.players[2].teamId, 20, 'explicit override must apply before eligibility');
assert.equal(result.eligibility.players[2].assessment, 'candidate');
assert.deepEqual(result.readiness.summary, {
  teamCount: 2, teamsWithCandidates: 2, teamsWithoutCandidates: 0,
  candidateCount: 2, unresolvedPlayerCount: 3
});
assert.equal(result.validation.valid, false, 'unresolved references still block canonical validation');
assert.deepEqual(result.validation, result.bridge.validation);
assert.equal(result.simulationAuthorized, false);
assert.equal(result.readiness.teams[0].gameReady, null);
assert.equal(result.eligibility.players[0].gameEligible, null);
assert.equal(result.sourceStateMutated, false);
assert.equal(result.persistencePerformed, false);

const directBridge = createCanonicalFranchiseBridgeSnapshot(universe, roster, options);
const directEligibility = assessSimulationRosterEligibility(directBridge);
const directReadiness = createSimulationRosterReadinessReport(directEligibility);
assert.deepEqual(result.bridge.players, directBridge.players);
assert.deepEqual(result.eligibility, directEligibility);
assert.deepEqual(result.readiness, directReadiness);
result.readiness.teams[0].candidatePlayerIds.push(999);
assert.deepEqual(result.eligibility.teams[0].candidatePlayerIds, [1]);
assert.equal(universe.players[0].teamId, 10);

const clean = createSimulationRosterReadinessPipeline(
  { teams: [{ id: 10, name: 'Wolves' }], players: [{ id: 7, teamId: 10 }] },
  { players: [] }
);
assert.equal(clean.validation.valid, true);
assert.equal(clean.simulationAuthorized, false, 'valid identity data never authorizes gameplay');
assert.equal(clean.readiness.summary.candidateCount, 1);
assert.equal(clean.readiness.teams[0].gameReady, null);
console.log('Mission 668 roster readiness pipeline tests passed.');
