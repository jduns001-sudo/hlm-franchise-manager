'use strict';
const assert = require('assert');
const { LEGACY_LOCAL_STORAGE_KEY, inspectLegacyFrontOfficeState, planLegacyMigration, createLegacyMigrationPreview } = require('./hlm-legacy-migration');

const legacy = {
  players: [{ id: 1 }],
  teams: [{ id: 5 }],
  seasons: [{ season: 2026 }],
  awards: [{ name: 'Award' }],
  transactions: [{ type: 'Signing' }],
  draftPicks: [{ year: 2027, round: 1 }],
  prospects: [{ id: 2 }],
  draftClasses: [{ year: 2027 }],
  contracts: [{ playerId: 1 }],
  gmSettings: { controlledTeamId: 5 },
  snapshot: { note: 'legacy' },
  franchiseName: 'Legacy Franchise'
};
const before = JSON.stringify(legacy);
const inspection = inspectLegacyFrontOfficeState(legacy);
assert.strictEqual(inspection.legacyStorageKey, 'hlm_tracker_v3');
assert.strictEqual(inspection.counts.players, 1);
assert.strictEqual(inspection.franchiseName, 'Legacy Franchise');

const plan = planLegacyMigration(legacy);
assert.strictEqual(plan.destructive, false);
assert.strictEqual(plan.mappings.contracts, 'assets.contracts');
assert(plan.deferred.includes('gmSettings'));

const preview = createLegacyMigrationPreview(legacy, { saveId: 'SAVE-preview', controlledTeamId: 5 });
assert.strictEqual(preview.state.universe.players.length, 1);
assert.strictEqual(preview.state.assets.draftPicks.length, 1);
assert.strictEqual(preview.state.activity.transactions.length, 1);
assert.strictEqual(preview.state.history.seasons.length, 1);
assert.strictEqual(JSON.stringify(legacy), before);
assert.strictEqual(LEGACY_LOCAL_STORAGE_KEY, 'hlm_tracker_v3');

const malformed = inspectLegacyFrontOfficeState({ players: {} });
assert(malformed.missingOrInvalidArrays.includes('players'));

console.log('Legacy migration boundary tests passed.');
