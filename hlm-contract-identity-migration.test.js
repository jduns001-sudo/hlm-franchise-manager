'use strict';
const assert = require('assert');
const { migrateContractIdentities } = require('./hlm-contract-identity-migration');

const legacy = [
  { playerId: 10, teamId: 5, startYear: 2026, aav: 1000000 },
  { playerId: 11, teamId: 5, startYear: 2026, aav: 2000000 },
  { contractId: 'CON-existing_1', playerId: 12, teamId: 6 }
];
const before = JSON.stringify(legacy);
const first = migrateContractIdentities(legacy);
const second = migrateContractIdentities(legacy);

assert.strictEqual(first.changed, 2);
assert.strictEqual(first.audit.migrationRequired, false);
assert.strictEqual(first.contracts[2].contractId, 'CON-existing_1');
assert.deepStrictEqual(first.contracts.map(x => x.contractId), second.contracts.map(x => x.contractId));
assert.strictEqual(JSON.stringify(legacy), before);

const rerun = migrateContractIdentities(first.contracts);
assert.strictEqual(rerun.changed, 0);
assert.deepStrictEqual(rerun.contracts, first.contracts);

console.log('Contract identity migration tests passed.');
