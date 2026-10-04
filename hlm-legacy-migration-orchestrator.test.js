'use strict';
const assert = require('assert');
const { prepareLegacyMigration } = require('./hlm-legacy-migration-orchestrator');

const legacy = {
  players: [{ id: 1 }],
  teams: [{ id: 5 }],
  seasons: [], awards: [], prospects: [], draftClasses: [],
  contracts: [{ playerId: 1, teamId: 5, startYear: 2026 }],
  transactions: [{ playerId: 1, teamId: 5, date: '2026-07-01', type: 'Signing' }],
  draftPicks: [],
  gmSettings: {}, snapshot: {}
};
const before = JSON.stringify(legacy);
const result = prepareLegacyMigration(legacy);
assert.strictEqual(result.transformations.contractsChanged, 1);
assert.strictEqual(result.transformations.transactionsChanged, 1);
assert(result.state.assets.contracts[0].contractId.startsWith('CON-'));
assert(result.state.activity.transactions[0].transactionId.startsWith('TXN-'));
assert.strictEqual(result.persistencePerformed, false);
assert.strictEqual(result.readyForPersistencePlanning, false);
assert(result.unresolved.some(x => x.code === 'DEFERRED_LEGACY_FIELDS'));
assert.strictEqual(JSON.stringify(legacy), before);

const picks = prepareLegacyMigration({ ...legacy, draftPicks: [{ year: 2027, round: 1, originalTeamId: 5 }] });
assert(picks.unresolved.some(x => x.code === 'DRAFT_PICK_IDENTITY_UNRESOLVED'));

console.log('Legacy migration orchestrator tests passed.');
