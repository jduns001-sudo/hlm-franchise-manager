'use strict';
const assert = require('node:assert/strict');
const { createFranchiseDataHealthReport } = require('./hlm-franchise-data-health-report');
const { createSimulationRosterReadinessPipeline } = require('./hlm-simulation-roster-readiness-pipeline');
const { createRosterReadinessValidationSummary } = require('./hlm-roster-readiness-validation-summary');

function verifyParity(universe, roster) {
  const original = JSON.stringify({ universe, roster });
  const report = createFranchiseDataHealthReport(universe, roster);
  const pipeline = createSimulationRosterReadinessPipeline(universe, roster);
  const summary = createRosterReadinessValidationSummary(pipeline);
  assert.deepEqual(report.dataQuality, summary.dataQuality, 'canonical errors and counts preserved');
  assert.deepEqual(report.warnings, summary.warnings, 'warning categories and counts preserved');
  assert.deepEqual(report.roster.summary, pipeline.readiness.summary);
  assert.deepEqual(report.roster.unresolvedByStatus, pipeline.readiness.unresolvedByStatus);
  assert.equal(report.simulationAuthorized, false);
  assert.equal(report.sourceStateMutated, false);
  assert.equal(report.persistencePerformed, false);
  assert.equal(JSON.stringify({ universe, roster }), original, 'inputs not mutated');
  return report;
}

// Empty Universe: no fabricated players, teams, or eligibility.
const empty = verifyParity({ teams: [], players: [] }, { players: [] });
assert.equal(empty.dataQuality.valid, true);
assert.equal(empty.roster.summary.teamCount, 0);
assert.equal(empty.roster.summary.candidateCount, 0);
assert.equal(empty.roster.summary.unresolvedPlayerCount, 0);
assert.deepEqual(empty.roster.teams, []);
assert.deepEqual(empty.roster.unresolvedByStatus, {});

// Missing team references: unknown positive IDs and distinct sentinels
// stay unresolved; none becomes a known team or an inferred free agent.
const missing = verifyParity({
  teams: [{ id: 10, name: 'Wolves' }],
  players: [
    { id: 1, teamId: 10 },
    { id: 2, teamId: 3515531 },
    { id: 3, teamId: -1 },
    { id: 4, teamId: 0 },
    { id: 5, teamId: 100 }
  ]
}, { players: [] });
assert.equal(missing.dataQuality.valid, false);
assert.equal(missing.roster.summary.candidateCount, 1);
assert.equal(missing.roster.summary.unresolvedPlayerCount, 4);
assert.equal(missing.roster.teams.length, 1);
assert.equal(missing.roster.teams[0].candidateCount, 1);
assert(missing.dataQuality.errors.filter(issue => issue.code === 'UNRESOLVED_PLAYER_TEAM_REFERENCE').length >= 3);
assert(missing.warnings.readiness.some(issue => issue.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && issue.teamId === 3515531));
assert(missing.warnings.readiness.some(issue => issue.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && issue.teamId === -1));
assert(missing.warnings.readiness.some(issue => issue.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && issue.teamId === 0));
assert(missing.warnings.readiness.some(issue => issue.code === 'UNRESOLVED_PLAYER_ORGANIZATION' && issue.teamId === 100));

// Duplicate Universe identities: only one canonical player survives, but
// the diagnostic remains a blocking data-quality error, never a warning-only issue.
const duplicate = verifyParity({
  teams: [{ id: 10, name: 'Wolves' }],
  players: [{ id: 7, teamId: 10 }, { id: 7, teamId: 10 }]
}, { players: [{ id: 999, ovr: 80 }] });
assert.equal(duplicate.dataQuality.valid, false);
assert.equal(duplicate.roster.summary.candidateCount, 1);
assert(duplicate.dataQuality.errors.some(issue => issue.code === 'DUPLICATE_UNIVERSE_PLAYER_ID'));
assert(duplicate.dataQuality.errors.some(issue => issue.code === 'ROSTER_PLAYER_MISSING_UNIVERSE'));
assert(duplicate.dataQuality.reportedIssueCount >= duplicate.dataQuality.errors.length);

// Returned reports are independent. Modifying one does not change inputs
// or future reports, including nested issue collections.
const input = {
  teams: [{ id: 10, name: 'Wolves' }],
  players: [{ id: 7, teamId: 10 }, { id: 7, teamId: 10 }]
};
const baseline = JSON.stringify(input);
const first = createFranchiseDataHealthReport(input, { players: [] });
first.dataQuality.errors[0].code = 'TAMPERED';
first.warnings.readiness[0].code = 'TAMPERED';
first.roster.teams[0].issues.push('TAMPERED');
const second = createFranchiseDataHealthReport(input, { players: [] });
assert(!second.dataQuality.errors.some(issue => issue.code === 'TAMPERED'));
assert(!second.warnings.readiness.some(issue => issue.code === 'TAMPERED'));
assert(!second.roster.teams[0].issues.includes('TAMPERED'));
assert.equal(JSON.stringify(input), baseline);
console.log('Mission 671 franchise data health contract tests passed.');
