'use strict';
const assert = require('assert');
const { AUTHORIZATION_PHRASE, authorizeSchema7Migration } = require('./hlm-schema7-migration-authorization');

(() => {
  const state = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [] };

  const denied = authorizeSchema7Migration(state, 'wrong');
  assert.strictEqual(denied.ready, true);
  assert.strictEqual(denied.authorized, false);
  assert.strictEqual(denied.executionAllowed, false);
  assert.strictEqual(denied.candidate, null);

  const allowed = authorizeSchema7Migration(state, AUTHORIZATION_PHRASE);
  assert.strictEqual(allowed.authorized, true);
  assert.strictEqual(allowed.executionAllowed, true);
  assert.strictEqual(allowed.writeAuthorized, true);
  assert.strictEqual(allowed.persistenceEnabled, true);
  assert.strictEqual(allowed.sourceMustBePreserved, true);
  assert.strictEqual(allowed.rollbackRequired, true);
  assert(allowed.candidate);

  const blocked = authorizeSchema7Migration({ schema: 6 }, AUTHORIZATION_PHRASE);
  assert.strictEqual(blocked.authorized, false);
  assert.strictEqual(blocked.executionAllowed, false);

  console.log('Schema 7 migration authorization tests passed.');
})();
