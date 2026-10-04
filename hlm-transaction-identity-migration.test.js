'use strict';
const assert = require('assert');
const { migrateTransactionIdentities } = require('./hlm-transaction-identity-migration');

const legacy = [
  { playerId: 10, teamId: 5, date: '2026-07-01', type: 'Signing' },
  { playerId: 11, toTeamId: 6, season: 2026, type: 'Trade' },
  { transactionId: 'TXN-existing_1', playerId: 12, teamId: 7, type: 'Waiver' }
];
const before = JSON.stringify(legacy);
const first = migrateTransactionIdentities(legacy);
const second = migrateTransactionIdentities(legacy);

assert.strictEqual(first.changed, 2);
assert.strictEqual(first.audit.migrationRequired, false);
assert.strictEqual(first.transactions[2].transactionId, 'TXN-existing_1');
assert.deepStrictEqual(first.transactions.map(x => x.transactionId), second.transactions.map(x => x.transactionId));
assert.strictEqual(JSON.stringify(legacy), before);

const rerun = migrateTransactionIdentities(first.transactions);
assert.strictEqual(rerun.changed, 0);
assert.deepStrictEqual(rerun.transactions, first.transactions);

console.log('Transaction identity migration tests passed.');
