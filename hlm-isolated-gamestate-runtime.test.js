'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { authorizeBrowserGameStateActivation, GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE } = require('./hlm-browser-gamestate-activation-authorization');
const { createIsolatedGameStateRuntime } = require('./hlm-isolated-gamestate-runtime');

const state = createGameStateEnvelope({
  meta: { saveId: 'mission69', controlledTeamId: 5 },
  players: [{ id: 'p1', name: 'Test Player' }],
  teams: [{ id: 5, name: 'Test Team' }]
});
const readiness = Object.freeze({
  kind: 'browser-gamestate-activation-readiness',
  version: 1,
  ready: true,
  slotId: 'mission69',
  gameStateVerified: true,
  checkpointVerified: true,
  activationAuthorized: false,
  activationPerformed: false,
  legacySourceDeletionAllowed: false,
  state,
  blockers: Object.freeze([])
});
const authorization = authorizeBrowserGameStateActivation(readiness, GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE);

const runtime = createIsolatedGameStateRuntime();
assert.strictEqual(runtime.active, false);
assert.strictEqual(runtime.read(), null);

const result = runtime.activate(authorization);
assert.strictEqual(result.activated, true);
assert.strictEqual(result.slotId, 'mission69');
assert.strictEqual(result.browserStorageWritePerformed, false);
assert.strictEqual(result.legacySourceDeletionAllowed, false);
assert.strictEqual(result.frontOfficeActivationPerformed, false);
assert.strictEqual(runtime.active, true);
assert.strictEqual(runtime.slotId, 'mission69');
assert.deepStrictEqual(runtime.read(), state);
assert.notStrictEqual(runtime.read(), state);

const copy = runtime.read();
copy.meta.controlledTeamId = 99;
assert.strictEqual(runtime.read().meta.controlledTeamId, 5);

assert.throws(() => runtime.activate(authorization), /already active/);

const unauthorizedRuntime = createIsolatedGameStateRuntime();
assert.throws(() => unauthorizedRuntime.activate({
  ...authorization,
  authorized: false,
  activationAllowed: false
}), /not authorized/);

assert.throws(() => createIsolatedGameStateRuntime().activate(null), /authorization is required/);

console.log('Isolated GameState activation runtime tests passed.');
