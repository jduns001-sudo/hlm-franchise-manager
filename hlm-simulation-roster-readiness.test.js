'use strict';
const assert = require('node:assert/strict');
const { createCanonicalFranchiseBridgeSnapshot } = require('./hlm-canonical-franchise-bridge');
const { assessSimulationRosterEligibility } = require('./hlm-simulation-roster-eligibility');
const { createSimulationRosterReadinessReport } = require('./hlm-simulation-roster-readiness');

const universe = {
  teams: [{ id: 10, name: 'Wolves' }, { id: 20, name: 'Falcons' }, { id: 30, name: 'Bears' }],
  players: [
    { id: 1, teamId: 10 },
    { id: 2, teamId: 10, retired: true },
    { id: 3, teamId: 20, retired: true },
    { id: 4, teamId: -1 },
    { id: 5, teamId: 0 },
    { id: 6, teamId: 100 },
    { id: 7, teamId: 3515531 }
  ]
};
const before = JSON.stringify(universe);
const snapshot = createCanonicalFranchiseBridgeSnapshot(universe, { players: [] });
const assessment = assessSimulationRosterEligibility(snapshot);
const assessmentBefore = JSON.stringify(assessment);
const report = createSimulationRosterReadinessReport(assessment);
assert.equal(JSON.stringify(universe), before);
assert.equal(JSON.stringify(assessment), assessmentBefore);
assert.equal(report.teams.length, 3);
assert.deepEqual(report.summary, {
  teamCount: 3, teamsWithCandidates: 1, teamsWithoutCandidates: 2,
  candidateCount: 1, unresolvedPlayerCount: 4
});
assert.equal(report.teams[0].candidateCount, 1);
assert.equal(report.teams[0].excludedCount, 1);
assert.deepEqual(report.teams[0].candidatePlayerIds, [1]);
assert(report.teams[0].issues.includes('RETIRED_ASSOCIATED_PLAYERS'));
assert.equal(report.teams[1].candidateCount, 0);
assert(report.teams[1].issues.includes('NO_CONFIRMED_TEAM_CANDIDATES'));
assert.equal(report.teams[2].associatedCount, 0);
assert(report.teams[2].issues.includes('NO_CONFIRMED_TEAM_CANDIDATES'));
assert.equal(report.teams[0].gameReady, null);
assert.equal(report.teams[0].rosterSufficiency, 'unknown');
assert.equal(report.thresholdsApplied, false);
assert.deepEqual(report.unresolvedByStatus, {
  'sentinel-no-team': 1, 'sentinel-unassigned': 1,
  'sentinel-legacy-unknown': 1, 'external-organization-unresolved': 1
});
assert.deepEqual(report.unresolvedPlayers.map(p => p.teamId), [-1, 0, 100, 3515531]);
assert.equal(report.sourceStateMutated, false);
assert.equal(report.persistencePerformed, false);
report.teams[0].candidatePlayerIds.push(999);
report.unresolvedPlayers[0].teamId = 999;
assert.deepEqual(assessment.teams[0].candidatePlayerIds, [1]);
assert.equal(assessment.players[3].teamId, -1);

const empty = createSimulationRosterReadinessReport(assessSimulationRosterEligibility(
  createCanonicalFranchiseBridgeSnapshot({ teams: [], players: [] }, { players: [] })
));
assert.deepEqual(empty.summary, {
  teamCount: 0, teamsWithCandidates: 0, teamsWithoutCandidates: 0,
  candidateCount: 0, unresolvedPlayerCount: 0
});
assert.throws(() => createSimulationRosterReadinessReport({}), { code: 'INVALID_ROSTER_READINESS_INPUT' });
console.log('Mission 667 roster readiness diagnostics tests passed.');
