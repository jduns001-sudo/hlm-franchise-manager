'use strict';
const assert = require('assert');
const { validateLegacyMigration } = require('./hlm-legacy-migration-validation');

const warningLegacy = {
  players: [{ id: 1 }],
  teams: [{ id: 5 }],
  seasons: [],
  awards: [],
  transactions: [{ type: 'Signing' }],
  draftPicks: [{ year: 2027, round: 1, originalTeamId: 5 }],
  prospects: [],
  draftClasses: [],
  contracts: [{ playerId: 1 }],
  gmSettings: {},
  snapshot: {}
};
const before = JSON.stringify(warningLegacy);
const warningResult = validateLegacyMigration(warningLegacy);
assert.strictEqual(warningResult.classification, 'warning');
assert.strictEqual(warningResult.safeToPersist, false);
assert(warningResult.warnings.some(w => w.code === 'CONTRACT_IDS_REQUIRE_MIGRATION'));
assert(warningResult.warnings.some(w => w.code === 'TRANSACTION_IDS_REQUIRE_MIGRATION'));
assert(warningResult.warnings.some(w => w.code === 'DRAFT_PICK_IDS_REQUIRE_MIGRATION'));
assert.strictEqual(JSON.stringify(warningLegacy), before);

const blocked = validateLegacyMigration({
  players: [{ id: 1 }, { id: 1 }],
  teams: [{ id: 5 }, { id: 5 }],
  contracts: [],
  transactions: [],
  draftPicks: [],
  seasons: [],
  awards: [],
  prospects: [],
  draftClasses: []
});
assert.strictEqual(blocked.classification, 'blocked');
assert(blocked.blockers.some(b => b.code === 'DUPLICATE_PLAYER_IDS'));
assert(blocked.blockers.some(b => b.code === 'DUPLICATE_TEAM_IDS'));

console.log('Legacy migration validation tests passed.');
