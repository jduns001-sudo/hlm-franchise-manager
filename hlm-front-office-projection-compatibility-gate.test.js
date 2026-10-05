'use strict';
const assert = require('assert');
const { verifyFrontOfficeProjectionCompatibility } = require('./hlm-front-office-projection-compatibility-gate');

function snapshot(overrides = {}) {
  return {
    players: [{ id: 'p1' }],
    teams: [{ id: 'PIT' }],
    contracts: [{ id: 'c1' }],
    draftPicks: [{ id: 'd1' }],
    transactions: [{ id: 't1' }],
    settings: { controlledTeamId: 'PIT' },
    ...overrides
  };
}

const matching = verifyFrontOfficeProjectionCompatibility(
  snapshot(),
  snapshot({ gmSettings: { controlledTeamId: 'PIT' } })
);
assert.strictEqual(matching.compatible, true);
assert.strictEqual(matching.controlledTeamMatches, true);
assert.strictEqual(matching.collectionChecks.players.compatible, true);
assert.strictEqual(matching.frontOfficeCutoverAllowed, false);
assert.strictEqual(matching.persistenceWriteAllowed, false);
assert.strictEqual(matching.liveFrontOfficeWiringPerformed, false);

const countMismatch = verifyFrontOfficeProjectionCompatibility(
  snapshot(),
  snapshot({ players: [] })
);
assert.strictEqual(countMismatch.compatible, false);
assert(countMismatch.blockers.includes('players collection count differs between legacy and projected snapshots'));

const teamMismatch = verifyFrontOfficeProjectionCompatibility(
  snapshot(),
  snapshot({ settings: { controlledTeamId: 'BOS' } })
);
assert.strictEqual(teamMismatch.compatible, false);
assert(teamMismatch.blockers.includes('Controlled team differs between legacy and projected snapshots'));

const invalidProjectedCollection = verifyFrontOfficeProjectionCompatibility(
  snapshot(),
  snapshot({ draftPicks: null })
);
assert.strictEqual(invalidProjectedCollection.compatible, false);
assert(invalidProjectedCollection.blockers.includes('Projected snapshot draftPicks collection is missing or invalid'));

assert.throws(
  () => verifyFrontOfficeProjectionCompatibility(null, snapshot()),
  /Legacy Front Office snapshot is required/
);

console.log('Front Office projection compatibility gate tests passed.');
