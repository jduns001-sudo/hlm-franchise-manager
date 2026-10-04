'use strict';
const assert = require('assert');
const { createPermanentId, validPermanentId, auditMutableRecordIdentity } = require('./hlm-record-identity');

assert.strictEqual(createPermanentId('contract', 'abc_123'), 'CON-abc_123');
assert.strictEqual(createPermanentId('transaction', '2026X1'), 'TXN-2026X1');
assert.strictEqual(validPermanentId('CON-abc_123', 'contract'), true);
assert.strictEqual(validPermanentId('TXN-2026X1', 'transaction'), true);
assert.strictEqual(validPermanentId('CON-abc_123', 'transaction'), false);
assert.throws(() => createPermanentId('contract', ''), /stable token/);

const db = {
  contracts: [
    { playerId: 1 },
    { contractId: 'CON-one', playerId: 2 },
    { contractId: 'CON-one', playerId: 3 },
    { contractId: 'bad id', playerId: 4 }
  ],
  transactions: [
    { type: 'Signing' },
    { transactionId: 'TXN-one', type: 'Trade' }
  ]
};
const before = JSON.stringify(db);
const audit = auditMutableRecordIdentity(db);
assert.strictEqual(audit.contracts.missing.length, 1);
assert.strictEqual(audit.contracts.duplicates.length, 1);
assert.strictEqual(audit.contracts.invalid.length, 1);
assert.strictEqual(audit.contracts.migrationRequired, true);
assert.strictEqual(audit.transactions.missing.length, 1);
assert.strictEqual(JSON.stringify(db), before, 'identity audit must be read-only');

console.log('Record identity foundation tests passed.');
