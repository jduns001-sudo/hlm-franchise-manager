'use strict';
const assert = require('assert');
const { auditPhase1Foundation } = require('./hlm-phase1-readiness');

const universe = {
  players: [{ id: 1, teamId: 1, ovr: 70 }],
  teams: [{ id: 1, name: 'Known' }],
  draftPicks: [{ leagueId: 1, year: 2027, originalTeamId: 1, ownerTeamId: 1, round: 1 }]
};
const roster = { players: [{ id: 1, ovr: 75, pos: 'C' }], draftPicks: [] };
const db = { contracts: [{ playerId: 1 }], transactions: [{ type: 'Signing' }] };
const before = JSON.stringify({ universe, roster, db });
const report = auditPhase1Foundation(universe, roster, db);

assert.strictEqual(report.phase, 1);
assert.strictEqual(report.player.validation.valid, true);
assert.strictEqual(report.teamReferences.knownTeams, 1);
assert.strictEqual(report.blockers.length, 0);
assert.strictEqual(report.readyForPhase2Planning, true);
assert(report.deferredMigrations.includes('contract-permanent-ids'));
assert(report.deferredMigrations.includes('transaction-permanent-ids'));
assert(report.deferredMigrations.includes('draft-pick-permanent-ids'));
assert.strictEqual(JSON.stringify({ universe, roster, db }), before, 'readiness audit must not mutate inputs');

const broken = auditPhase1Foundation({
  players: [{ id: 1 }, { id: 1 }],
  teams: [{ id: 1 }, { id: 1 }],
  draftPicks: []
}, { players: [] }, {});
assert.strictEqual(broken.readyForPhase2Planning, false);
assert(broken.blockers.some(x => x.code === 'DUPLICATE_UNIVERSE_PLAYER_ID'));
assert(broken.blockers.some(x => x.code === 'DUPLICATE_TEAM_ID'));

console.log('Phase 1 foundation readiness tests passed.');
