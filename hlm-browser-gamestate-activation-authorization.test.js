'use strict';
const assert = require('assert');
const {
  GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE,
  authorizeBrowserGameStateActivation
} = require('./hlm-browser-gamestate-activation-authorization');

const state = Object.freeze({ schemaVersion: 1 });
const ready = Object.freeze({
  kind: 'browser-gamestate-activation-readiness',
  version: 1,
  ready: true,
  slotId: 'primary',
  gameStateVerified: true,
  checkpointVerified: true,
  activationAuthorized: false,
  activationPerformed: false,
  legacySourceDeletionAllowed: false,
  state,
  blockers: Object.freeze([])
});

const wrong = authorizeBrowserGameStateActivation(ready, 'wrong');
assert.strictEqual(wrong.authorized, false);
assert.strictEqual(wrong.activationAllowed, false);
assert.strictEqual(wrong.activationPerformed, false);
assert.strictEqual(wrong.state, null);
assert(wrong.blockers.includes('Explicit GameState activation authorization required'));

const authorized = authorizeBrowserGameStateActivation(ready, GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE);
assert.strictEqual(authorized.authorized, true);
assert.strictEqual(authorized.activationAllowed, true);
assert.strictEqual(authorized.activationPerformed, false);
assert.strictEqual(authorized.slotId, 'primary');
assert.strictEqual(authorized.state, state);
assert.strictEqual(authorized.persistenceWriteAllowed, false);
assert.strictEqual(authorized.legacySourceDeletionAllowed, false);
assert.deepStrictEqual(authorized.blockers, []);

const notReady = authorizeBrowserGameStateActivation(Object.freeze({
  ...ready,
  ready: false,
  blockers: Object.freeze(['verification failed'])
}), GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE);
assert.strictEqual(notReady.authorized, false);
assert.strictEqual(notReady.activationAllowed, false);
assert(notReady.blockers.includes('verification failed'));

const noCheckpoint = authorizeBrowserGameStateActivation(Object.freeze({
  ...ready,
  checkpointVerified: false
}), GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE);
assert.strictEqual(noCheckpoint.authorized, false);
assert(noCheckpoint.blockers.includes('Verified recovery checkpoint is required'));

const invalid = authorizeBrowserGameStateActivation(null, GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE);
assert.strictEqual(invalid.authorized, false);
assert(invalid.blockers.includes('GameState activation readiness result is required'));

console.log('Browser GameState activation authorization tests passed.');
