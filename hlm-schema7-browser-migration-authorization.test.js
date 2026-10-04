'use strict';
const assert = require('assert');
const {
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE,
  authorizeSchema7BrowserMigration
} = require('./hlm-schema7-browser-migration-authorization');

const source = {
  schema: 7,
  settings: { controlledTeamId: 5 },
  contracts: [], transactions: [], draftPicks: [], prospects: [], history: [],
  lines: { NHL: [] }, depth: { NHL: [] }, draftBoard: [101], waivers: [], notes: { gm: 'keep' }
};
const before = JSON.stringify(source);

const denied = authorizeSchema7BrowserMigration(source, 'wrong');
assert.strictEqual(denied.ready, true);
assert.strictEqual(denied.authorizationRequested, false);
assert.strictEqual(denied.authorized, false);
assert.strictEqual(denied.executionAllowed, false);
assert(denied.blockers.includes('Explicit browser migration authorization required'));

const allowed = authorizeSchema7BrowserMigration(source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE);
assert.strictEqual(allowed.ready, true);
assert.strictEqual(allowed.authorizationRequested, true);
assert.strictEqual(allowed.authorized, true);
assert.strictEqual(allowed.executionAllowed, true);
assert.strictEqual(allowed.writeAuthorized, true);
assert.strictEqual(allowed.persistenceEnabled, false);
assert.strictEqual(allowed.sourceSchema, 7);
assert.strictEqual(allowed.targetSchemaVersion, 1);
assert.strictEqual(allowed.sourcePreserved, true);
assert.strictEqual(allowed.roundTripVerified, true);
assert.strictEqual(allowed.sourceMutationAllowed, false);
assert.strictEqual(allowed.sourceDeletionAllowed, false);
assert.deepStrictEqual(allowed.blockers, []);
assert.strictEqual(JSON.stringify(source), before);

const blocked = authorizeSchema7BrowserMigration({ schema: 6 }, BROWSER_MIGRATION_AUTHORIZATION_PHRASE);
assert.strictEqual(blocked.ready, false);
assert.strictEqual(blocked.authorizationRequested, true);
assert.strictEqual(blocked.authorized, false);
assert.strictEqual(blocked.executionAllowed, false);
assert.strictEqual(blocked.persistenceEnabled, false);
assert(blocked.blockers.length > 0);

const repeated = authorizeSchema7BrowserMigration(source, BROWSER_MIGRATION_AUTHORIZATION_PHRASE);
assert.deepStrictEqual(repeated, allowed);
assert.strictEqual(JSON.stringify(source), before);

console.log('Schema 7 browser migration authorization tests passed.');
