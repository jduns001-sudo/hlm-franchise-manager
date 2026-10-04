'use strict';

const { createBrowserSaveAdapter, DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { createSchema7IsolatedRepositoryBridge } = require('./hlm-schema7-isolated-repository-bridge');
const { createSchema7GameStateExecutionPackage } = require('./hlm-schema7-gamestate-execution-package');
const { verifyGameStateRoundTrip } = require('./hlm-game-state-serialization');
const { serializeGameState, deserializeGameState } = require('./hlm-game-state-serialization');

const LEGACY_LOCAL_STORAGE_KEY = 'hlm_tracker_v3';

function createSchema7BrowserGameStateBridge(storage, slotId, metadata = {}) {
  if (!storage || typeof storage.getItem !== 'function') throw new Error('Web Storage-compatible storage is required');
  const legacyBefore = storage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  const repository = createBrowserSaveAdapter(storage, DEFAULT_STORAGE_KEY);
  const bridge = createSchema7IsolatedRepositoryBridge(repository, slotId, metadata);

  return Object.freeze({
    slotId: bridge.slotId,
    storageKey: DEFAULT_STORAGE_KEY,
    sourceAccess: false,
    async migrate(snapshot, authorization, options = {}) {
      const executionPackage = createSchema7GameStateExecutionPackage(snapshot, authorization, options);
      const canonicalPackage = executionPackage.executable && executionPackage.candidate
        ? Object.freeze({ ...executionPackage, candidate: deserializeGameState(serializeGameState(executionPackage.candidate)) })
        : executionPackage;
      const result = await bridge.execute(canonicalPackage);
      if (storage.getItem(LEGACY_LOCAL_STORAGE_KEY) !== legacyBefore) {
        throw new Error('Legacy Front Office localStorage changed during isolated migration');
      }
      return Object.freeze({ ...result, transformed: executionPackage.transformed, gameStateValid: executionPackage.gameStateValid });
    }
  });
}

module.exports = { LEGACY_LOCAL_STORAGE_KEY, createSchema7BrowserGameStateBridge };
