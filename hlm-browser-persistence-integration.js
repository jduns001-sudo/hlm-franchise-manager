'use strict';

const { createBrowserSaveAdapter, DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { executeAtomicPersistence } = require('./hlm-persistence-executor');

const LEGACY_STORAGE_KEY = 'hlm_tracker_v3';

function executeBrowserPersistence(plan, storage, slotId, metadata = {}) {
  if (!storage || typeof storage.getItem !== 'function') throw new TypeError('Web Storage-compatible storage is required');
  const legacyBefore = storage.getItem(LEGACY_STORAGE_KEY);
  const repository = createBrowserSaveAdapter(storage);
  const result = executeAtomicPersistence(plan, repository, slotId, metadata);
  const legacyAfter = storage.getItem(LEGACY_STORAGE_KEY);
  if (legacyAfter !== legacyBefore) {
    const error = new Error('Legacy Front Office storage changed during isolated persistence');
    error.code = 'LEGACY_STORAGE_MUTATED';
    error.persistenceResult = result;
    throw error;
  }
  return { ...result, storageKey: DEFAULT_STORAGE_KEY, legacyStorageKey: LEGACY_STORAGE_KEY, legacySourcePreserved: true };
}

module.exports = { LEGACY_STORAGE_KEY, executeBrowserPersistence };
