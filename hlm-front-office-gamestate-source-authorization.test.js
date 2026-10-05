'use strict';
const assert = require('assert');
const {
  FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE,
  authorizeFrontOfficeGameStateSource
} = require('./hlm-front-office-gamestate-source-authorization');

const ready = Object.freeze({
  kind: 'front-office-gamestate-activation-readiness',
  version: 1,
  ready: true,
  slotId: 'mission72',
  isolatedActivationVerified: true,
  legacyRuntimeReadable: true,
  legacyRuntimeReadOnly: true,
  gameStateSourceOfTruthAuthorized: false,
  frontOfficeActivationAllowed: false,
  frontOfficeActivationPerformed: false,
  legacySourceDeletionAllowed: false,
  blockers: Object.freeze([])
});

const wrong = authorizeFrontOfficeGameStateSource(ready, 'wrong');
assert.strictEqual(wrong.authorized, false);
assert.strictEqual(wrong.gameStateSourceOfTruthAuthorized, false);
assert.strictEqual(wrong.frontOfficeActivationAllowed, false);
assert.strictEqual(wrong.frontOfficeActivationPerformed, false);
assert(wrong.blockers.includes('Explicit Front Office GameState source authorization required'));

const authorized = authorizeFrontOfficeGameStateSource(
  ready,
  FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE
);
assert.strictEqual(authorized.authorized, true);
assert.strictEqual(authorized.gameStateSourceOfTruthAuthorized, true);
assert.strictEqual(authorized.frontOfficeActivationAllowed, true);
assert.strictEqual(authorized.frontOfficeActivationPerformed, false);
assert.strictEqual(authorized.slotId, 'mission72');
assert.strictEqual(authorized.persistenceWriteAllowed, false);
assert.strictEqual(authorized.legacySourceDeletionAllowed, false);
assert.deepStrictEqual(authorized.blockers, []);

const notReady = authorizeFrontOfficeGameStateSource(Object.freeze({
  ...ready,
  ready: false,
  blockers: Object.freeze(['readiness failed'])
}), FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE);
assert.strictEqual(notReady.authorized, false);
assert(notReady.blockers.includes('readiness failed'));

const notReadOnly = authorizeFrontOfficeGameStateSource(Object.freeze({
  ...ready,
  legacyRuntimeReadOnly: false
}), FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE);
assert.strictEqual(notReadOnly.authorized, false);
assert(notReadOnly.blockers.includes('Legacy Front Office runtime must remain read-only'));

const invalid = authorizeFrontOfficeGameStateSource(null, FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE);
assert.strictEqual(invalid.authorized, false);
assert(invalid.blockers.includes('Front Office GameState activation readiness result is required'));

console.log('Front Office GameState source authorization tests passed.');
