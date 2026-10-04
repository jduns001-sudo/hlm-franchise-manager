'use strict';
const assert = require('assert');
const { AUTHORIZATION_PHRASE } = require('./hlm-schema7-migration-authorization');
const { createSchema7MigrationExecutionPackage } = require('./hlm-schema7-migration-execution-package');

(() => {
  const state = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [] };
  const denied = createSchema7MigrationExecutionPackage(state, 'wrong');
  assert.strictEqual(denied.executable, false);
  assert.strictEqual(denied.candidate, null);

  const allowed = createSchema7MigrationExecutionPackage(state, AUTHORIZATION_PHRASE);
  assert.strictEqual(allowed.executable, true);
  assert.strictEqual(allowed.target, 'isolated-game-state-save');
  assert.strictEqual(allowed.sourceMustBePreserved, true);
  assert.strictEqual(allowed.rollbackRequired, true);
  assert.strictEqual(allowed.verifyAfterWrite, true);
  assert.strictEqual(allowed.deleteSourceAllowed, false);
  assert(allowed.candidate);
  assert(allowed.backup);

  console.log('Schema 7 migration execution package tests passed.');
})();
