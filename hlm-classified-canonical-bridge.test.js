'use strict';
const assert = require('node:assert/strict');
const { createCanonicalFranchiseBridgeSnapshot } = require('./hlm-canonical-franchise-bridge');

const universe = {
  teams: [{ id: 10, name: 'Wolves' }, { id: 20, name: 'Falcons' }],
  players: [
    { id: 1, teamId: 10, ovr: 70 },
    { id: 2, teamId: -1, ovr: 71 },
    { id: 3, teamId: 0 },
    { id: 4, teamId: 100 },
    { id: 5, teamId: 3515531 },
    { id: 6, teamId: -8 },
    { id: 7, teamId: '10' }
  ]
};
const roster = { players: [{ id: 1, teamId: 20, ovr: 80 }, { id: 1, teamId: 20, ovr: 81 }] };
const options = { playerOverrides: { 2: { teamId: 20 } } };
const before = JSON.stringify({ universe, roster, options });
const result = createCanonicalFranchiseBridgeSnapshot(universe, roster, options);
assert.equal(JSON.stringify({ universe, roster, options }), before, 'inputs must not change');
assert.equal(result.players.length, 7, 'historical duplicates must not become new players');
assert.equal(result.players[0].teamId, 10, 'roster history must not override canonical assignment');
assert.equal(result.players[0].organizationReference.status, 'known-team');
assert.equal(result.players[1].teamId, 20, 'explicit override must precede classification');
assert.equal(result.players[1].organizationReference.status, 'known-team');
assert.equal(result.players[2].organizationReference.status, 'sentinel-unassigned');
assert.equal(result.players[3].organizationReference.status, 'sentinel-legacy-unknown');
assert.equal(result.players[4].organizationReference.status, 'external-organization-unresolved');
assert.equal(result.players[5].organizationReference.status, 'other-negative-sentinel');
assert.equal(result.players[6].organizationReference.status, 'invalid-reference');
assert.equal(result.players[4].organizationReference.teamId, 3515531);
assert.equal(result.players[3].organizationReference.teamId, 100);
assert.equal(result.players[2].organizationReference.eligibleFreeAgent, null);
assert.equal(result.players[4].teamResolved, false);
assert.equal(result.validation.valid, false, 'existing unresolved reference validation remains unchanged');
assert.equal(result.diagnostics.filter(d => d.code === 'UNRESOLVED_PLAYER_TEAM_REFERENCE').length, 5);
assert.equal(result.canonicalSummary.duplicateRosterIds, 1);
assert.equal(result.persistencePerformed, false);
assert.equal(result.sourceStateMutated, false);

const sentinel = createCanonicalFranchiseBridgeSnapshot(
  { teams: [{ id: 10, name: 'Wolves' }], players: [{ id: 8, teamId: -1 }] },
  { players: [] }
);
assert.equal(sentinel.players[0].organizationReference.status, 'sentinel-no-team');
assert.equal(sentinel.players[0].organizationReference.eligibleFreeAgent, null);

const clean = createCanonicalFranchiseBridgeSnapshot(
  { teams: [{ id: 10, name: 'Wolves' }], players: [{ id: 9, teamId: 10 }] },
  { players: [] }
);
assert.equal(clean.validation.valid, true);
assert.equal(clean.players[0].organizationReference.confidence, 'confirmed');
clean.players[0].organizationReference.status = 'tampered';
assert.equal(universe.players[0].teamId, 10);
console.log('Mission 665 classified canonical bridge tests passed.');
