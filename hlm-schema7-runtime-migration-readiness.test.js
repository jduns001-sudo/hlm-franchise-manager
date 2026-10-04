'use strict';
const assert = require('assert');
const { evaluateSchema7RuntimeMigrationReadiness } = require('./hlm-schema7-runtime-migration-readiness');

const valid = {
  schema: 7,
  settings: { controlledTeamId: 5 },
  contracts: [],
  transactions: [],
  draftPicks: [],
  prospects: [],
  history: [],
  waivers: [],
  lines: {},
  depth: {}
};

const ready = evaluateSchema7RuntimeMigrationReadiness(valid);
assert.strictEqual(ready.ready, true);
assert.strictEqual(ready.readOnly, true);
assert.strictEqual(ready.writeAuthorized, false);
assert.strictEqual(ready.persistenceEnabled, false);
assert.strictEqual(ready.sourceMutationAllowed, false);
assert.strictEqual(ready.sourceDeletionAllowed, false);
assert.strictEqual(ready.target, 'isolated-game-state-save');

const wrongSchema = evaluateSchema7RuntimeMigrationReadiness({ ...valid, schema: 6 });
assert.strictEqual(wrongSchema.ready, false);
assert(wrongSchema.blockers.length > 0);

console.log('Schema 7 runtime migration readiness tests passed.');
