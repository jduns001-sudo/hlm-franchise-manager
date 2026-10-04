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
assert.strictEqual(result.readyForPersistencePlanning, true);
assert.strictEqual(result.unresolved.length, 0);
assert.strictEqual(result.dataDiscarded, false);
assert(result.transformations.preservedLegacyFields.includes('gmSettings'));
assert.deepStrictEqual(result.state.extensions.legacy.preserved.gmSettings, legacy.gmSettings);
assert.strictEqual(JSON.stringify(legacy), before);

const picks = prepareLegacyMigration({ ...legacy, draftPicks: [{ year: 2027, round: 1, originalTeamId: 5 }] });
assert.strictEqual(picks.readyForPersistencePlanning, true);
assert.strictEqual(picks.unresolved.length, 0);
assert.strictEqual(picks.transformations.draftPicksChanged, 1);
assert(picks.state.assets.draftPicks[0].pickId.startsWith('PICK-'));

console.log('Legacy migration orchestrator tests passed.');
