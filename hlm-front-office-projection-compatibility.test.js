'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { projectGameStateForFrontOffice } = require('./hlm-front-office-gamestate-projection');
const { verifyFrontOfficeProjectionCompatibility } = require('./hlm-front-office-projection-compatibility');

function makeState() {
  return createGameStateEnvelope({
    meta: { controlledTeamId: 'PIT' },
    players: [{ id: 'p1' }],
    teams: [{ id: 'PIT' }],
    prospects: [{ id: 'prospect1' }],
    contracts: [{ id: 'contract1' }],
    draftPicks: [{ id: 'pick1' }],
    transactions: [{ id: 'tx1' }]
  });
}

const state = makeState();
const legacy = projectGameStateForFrontOffice(state);
const verified = verifyFrontOfficeProjectionCompatibility(legacy, state);

assert.strictEqual(verified.compatible, true);
assert.strictEqual(verified.blockers.length, 0);
assert.strictEqual(verified.controlledTeamCompatible, true);
assert.strictEqual(verified.legacyControlledTeamId, 'PIT');
assert.strictEqual(verified.projectedControlledTeamId, 'PIT');
for (const result of Object.values(verified.collections)) {
  assert.strictEqual(result.compatible, true);
}
assert.strictEqual(verified.frontOfficeActivationAllowed, false);
assert.strictEqual(verified.frontOfficeActivationPerformed, false);
assert.strictEqual(verified.persistenceWritePerformed, false);
assert.strictEqual(verified.liveFrontOfficeWiringPerformed, false);

const mismatched = JSON.parse(JSON.stringify(legacy));
mismatched.players.push({ id: 'legacy-only-player' });
mismatched.gmSettings.controlledTeamId = 'BOS';
mismatched.settings.controlledTeamId = 'BOS';
const failed = verifyFrontOfficeProjectionCompatibility(mismatched, state);

assert.strictEqual(failed.compatible, false);
assert.strictEqual(failed.collections.players.compatible, false);
assert.strictEqual(failed.controlledTeamCompatible, false);
assert.ok(failed.blockers.some(blocker => blocker.code === 'COLLECTION_MISMATCH' && blocker.collection === 'players'));
assert.ok(failed.blockers.some(blocker => blocker.code === 'CONTROLLED_TEAM_MISMATCH'));

const missing = JSON.parse(JSON.stringify(legacy));
delete missing.contracts;
const missingResult = verifyFrontOfficeProjectionCompatibility(missing, state);
assert.strictEqual(missingResult.compatible, false);
assert.ok(missingResult.blockers.some(blocker => blocker.code === 'LEGACY_COLLECTION_MISSING' && blocker.collection === 'contracts'));

assert.throws(
  () => verifyFrontOfficeProjectionCompatibility(null, state),
  /Valid legacy Front Office snapshot is required/
);

console.log('Front Office projection compatibility tests passed.');
