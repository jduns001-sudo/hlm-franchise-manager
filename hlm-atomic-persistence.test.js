'use strict';
const assert = require('assert');
const { createAtomicPersistencePlan, validateAtomicPersistencePlan } = require('./hlm-atomic-persistence');

const legacy = {
  players: [{ id: 1 }], teams: [{ id: 5 }], seasons: [], awards: [],
  transactions: [{ playerId: 1, teamId: 5, type: 'Signing' }],
  draftPicks: [{ year: 2027, round: 1, originalTeamId: 5, ownerTeamId: 5 }],
  prospects: [], draftClasses: [], gmSettings: { controlledTeamId: 5 },
  contracts: [{ playerId: 1, teamId: 5 }], snapshot: {}, franchiseName: 'Test'
};
const before = JSON.stringify(legacy);
const plan = createAtomicPersistencePlan(legacy, { saveId: 'atomic-test' });
assert.strictEqual(validateAtomicPersistencePlan(plan).valid, true);
assert.strictEqual(plan.executable, false);
assert.strictEqual(plan.executed, false);
assert.strictEqual(plan.transaction.preserveLegacySource, true);
assert.strictEqual(plan.transaction.rollbackOnFailure, true);
assert.strictEqual(plan.transaction.deleteLegacyAfterSuccess, false);
assert.strictEqual(JSON.stringify(legacy), before);

const unsafe = JSON.parse(JSON.stringify(plan));
unsafe.transaction.rollbackOnFailure = false;
assert.strictEqual(validateAtomicPersistencePlan(unsafe).valid, false);
console.log('Atomic persistence boundary tests passed.');
