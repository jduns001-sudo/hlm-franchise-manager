'use strict';
const assert = require('assert');
const { evaluateSchema7BrowserMigrationReadiness } = require('./hlm-schema7-browser-migration-readiness');

const source = {
  schema: 7,
  settings: { controlledTeamId: 5 },
  contracts: [], transactions: [], draftPicks: [], prospects: [], history: [],
  lines: { NHL: [] }, depth: { NHL: [] }, draftBoard: [101], waivers: [], notes: { gm: 'keep' }
};
const before = JSON.stringify(source);
const ready = evaluateSchema7BrowserMigrationReadiness(source);
assert.strictEqual(ready.ready, true);
assert.strictEqual(ready.sourceSchema, 7);
assert.strictEqual(ready.targetSchemaVersion, 1);
assert.strictEqual(ready.sourcePreserved, true);
assert.strictEqual(ready.roundTripVerified, true);
assert.strictEqual(ready.writeAuthorized, false);
assert.strictEqual(ready.persistenceEnabled, false);
assert.strictEqual(ready.sourceMutationAllowed, false);
assert.strictEqual(ready.sourceDeletionAllowed, false);
assert.strictEqual(JSON.stringify(source), before);

const bad = evaluateSchema7BrowserMigrationReadiness({ schema: 6 });
assert.strictEqual(bad.ready, false);
assert(bad.blockers.length > 0);
console.log('Schema 7 browser migration readiness tests passed.');
