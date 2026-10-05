'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { authorizeBrowserGameStateActivation, GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE } = require('./hlm-browser-gamestate-activation-authorization');
const { createIsolatedGameStateRuntime } = require('./hlm-isolated-gamestate-runtime');
const { verifyIsolatedGameStateActivation } = require('./hlm-isolated-gamestate-activation-verification');

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; },
    snapshot() { return JSON.stringify(data); }
  };
}

function authorizationFor(state, slotId = 'mission70') {
  return authorizeBrowserGameStateActivation(Object.freeze({
    kind: 'browser-gamestate-activation-readiness',
    version: 1,
    ready: true,
    slotId,
    gameStateVerified: true,
    checkpointVerified: true,
    activationAuthorized: false,
    activationPerformed: false,
    legacySourceDeletionAllowed: false,
    state,
    blockers: Object.freeze([])
  }), GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE);
}

const state = createGameStateEnvelope({
  meta: { saveId: 'mission70', controlledTeamId: 5 },
  players: [{ id: 'p1', name: 'Verifier' }],
  teams: [{ id: 5, name: 'Verification Team' }]
});
const authorization = authorizationFor(state);
const storage = memoryStorage({ legacy: 'preserve-me' });
const before = storage.snapshot();
const runtime = createIsolatedGameStateRuntime();
runtime.activate(authorization);

const verified = verifyIsolatedGameStateActivation(runtime, authorization, before, storage);
assert.strictEqual(verified.verified, true);
assert.strictEqual(verified.stateMatches, true);
assert.strictEqual(verified.storageUnchanged, true);
assert.strictEqual(verified.frontOfficeActivationPerformed, false);
assert.strictEqual(verified.legacySourceDeletionAllowed, false);
assert.deepStrictEqual(verified.blockers, []);

const inactive = verifyIsolatedGameStateActivation(createIsolatedGameStateRuntime(), authorization);
assert.strictEqual(inactive.verified, false);
assert(inactive.blockers.includes('Isolated GameState runtime is not active'));

const otherAuthorization = authorizationFor(state, 'other-slot');
const slotMismatch = verifyIsolatedGameStateActivation(runtime, otherAuthorization);
assert.strictEqual(slotMismatch.verified, false);
assert(slotMismatch.blockers.includes('Active runtime slot does not match authorized slot'));

storage.setItem('unexpected', 'write');
const changed = verifyIsolatedGameStateActivation(runtime, authorization, before, storage);
assert.strictEqual(changed.verified, false);
assert.strictEqual(changed.storageUnchanged, false);
assert(changed.blockers.includes('Browser storage changed during isolated activation'));

console.log('Isolated GameState activation verification tests passed.');
