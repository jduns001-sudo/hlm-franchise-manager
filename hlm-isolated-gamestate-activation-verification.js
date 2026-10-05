'use strict';

const { serializeGameState } = require('./hlm-game-state-serialization');

function verifyIsolatedGameStateActivation(runtime, authorization, storageSnapshot = null, storage = null) {
  const blockers = [];

  if (!runtime || runtime.kind !== 'isolated-gamestate-runtime' || typeof runtime.read !== 'function') {
    blockers.push('Isolated GameState runtime is required');
  }
  if (!authorization || authorization.kind !== 'browser-gamestate-activation-authorization' || authorization.authorized !== true) {
    blockers.push('Authorized GameState activation result is required');
  }

  let runtimeState = null;
  if (!blockers.length) {
    if (runtime.active !== true) blockers.push('Isolated GameState runtime is not active');
    if (runtime.slotId !== authorization.slotId) blockers.push('Active runtime slot does not match authorized slot');
    runtimeState = runtime.read();
    if (!runtimeState) blockers.push('Active runtime GameState is missing');
  }

  let stateMatches = false;
  if (!blockers.length) {
    try {
      stateMatches = serializeGameState(runtimeState) === serializeGameState(authorization.state);
      if (!stateMatches) blockers.push('Active runtime GameState does not match authorized GameState');
    } catch (error) {
      blockers.push(error && error.message ? error.message : 'GameState comparison failed');
    }
  }

  let storageUnchanged = null;
  if (storageSnapshot !== null || storage !== null) {
    if (typeof storageSnapshot !== 'string') blockers.push('Storage snapshot must be JSON text');
    if (!storage || typeof storage.snapshot !== 'function') blockers.push('Snapshot-capable storage is required');
    if (typeof storageSnapshot === 'string' && storage && typeof storage.snapshot === 'function') {
      storageUnchanged = storage.snapshot() === storageSnapshot;
      if (!storageUnchanged) blockers.push('Browser storage changed during isolated activation');
    }
  }

  return Object.freeze({
    kind: 'isolated-gamestate-activation-verification',
    version: 1,
    verified: blockers.length === 0,
    slotId: runtime && runtime.slotId || null,
    stateMatches,
    storageUnchanged,
    frontOfficeActivationPerformed: false,
    legacySourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { verifyIsolatedGameStateActivation };
