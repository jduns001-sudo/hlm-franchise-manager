'use strict';
const assert = require('assert');
const { createBackupFirstMigrationPackage } = require('./hlm-backup-first-migration');

const legacy = {
  players: [{ id: 1 }], teams: [{ id: 5 }], seasons: [], awards: [],
  transactions: [{ playerId: 1, teamId: 5, type: 'Signing' }],
  draftPicks: [{ year: 2027, round: 1, originalTeamId: 5, ownerTeamId: 5 }],
  prospects: [], draftClasses: [],
  gmSettings: { controlledTeamId: 5 }, contracts: [{ playerId: 1, teamId: 5 }],
  snapshot: {}, franchiseName: 'Test'
};
const before = JSON.stringify(legacy);
const result = createBackupFirstMigrationPackage(legacy, { saveId: 'migration-test' });
assert.strictEqual(result.backupInspection.valid, true);
assert.strictEqual(result.persistenceAllowed, false);
assert.strictEqual(result.persistencePerformed, false);
assert(/^PICK-/.test(result.state.assets.draftPicks[0].pickId));
assert(/^CON-/.test(result.state.assets.contracts[0].contractId));
assert(/^TXN-/.test(result.state.activity.transactions[0].transactionId));
assert.strictEqual(JSON.stringify(legacy), before);
console.log('Backup-first migration package tests passed.');
