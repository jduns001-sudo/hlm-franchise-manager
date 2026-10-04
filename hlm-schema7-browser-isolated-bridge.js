'use strict';

const { createBrowserSaveAdapter, DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { createSchema7IsolatedRepositoryBridge } = require('./hlm-schema7-isolated-repository-bridge');

const LEGACY_LOCAL_STORAGE_KEY = 'hlm_tracker_v3';

function createSchema7BrowserIsolatedBridge(storage, slotId, metadata = {}) {
  if (!storage || typeof storage.getItem !== 'function') throw new Error('Web Storage-compatible storage is required');

  const legacyBefore = storage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  const repository = createBrowserSaveAdapter(storage, DEFAULT_STORAGE_KEY);
  const bridge = createSchema7IsolatedRepositoryBridge(repository, slotId, metadata);

  return Object.freeze({
    slotId: bridge.slotId,
    storageKey: DEFAULT_STORAGE_KEY,
    legacyStorageKey: LEGACY_LOCAL_STORAGE_KEY,
    sourceAccess: false,
    async execute(executionPackage) {
      const result = await bridge.execute(executionPackage);
      const legacyAfter = storage.getItem(LEGACY_LOCAL_STORAGE_KEY);
      if (legacyAfter !== legacyBefore) {
        throw new Error('Legacy Front Office localStorage changed during isolated execution');
      }
      return result;
    }
  });
}

module.exports = { LEGACY_LOCAL_STORAGE_KEY, createSchema7BrowserIsolatedBridge };
