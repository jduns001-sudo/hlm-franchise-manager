'use strict';

const { validateGameStateEnvelope } = require('./hlm-game-state');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createIsolatedGameStateRuntime() {
  let activeState = null;
  let activeSlotId = null;

  return Object.freeze({
    kind: 'isolated-gamestate-runtime',
    version: 1,
    get active() { return activeState !== null; },
    get slotId() { return activeSlotId; },
    read() { return activeState === null ? null : clone(activeState); },
    activate(authorization) {
      if (!authorization || authorization.kind !== 'browser-gamestate-activation-authorization') {
        throw new Error('GameState activation authorization is required');
      }
      if (authorization.authorized !== true || authorization.activationAllowed !== true) {
        throw new Error('GameState activation is not authorized');
      }
      if (authorization.activationPerformed !== false) {
        throw new Error('GameState authorization has already been activated');
      }
      if (!authorization.state || !validateGameStateEnvelope(authorization.state).valid) {
        throw new Error('Authorized GameState is invalid');
      }
      if (!authorization.slotId) throw new Error('Authorized save slot ID is required');
      if (activeState !== null) throw new Error('Isolated GameState runtime is already active');

      activeState = clone(authorization.state);
      activeSlotId = authorization.slotId;

      return Object.freeze({
        kind: 'isolated-gamestate-activation-result',
        version: 1,
        activated: true,
        slotId: activeSlotId,
        runtimeKind: 'isolated-gamestate-runtime',
        browserStorageWritePerformed: false,
        legacySourceDeletionAllowed: false,
        frontOfficeActivationPerformed: false
      });
    }
  });
}

module.exports = { createIsolatedGameStateRuntime };
