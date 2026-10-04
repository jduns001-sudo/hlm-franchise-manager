'use strict';

const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');

function assertStorage(storage) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
    throw new Error('Web Storage-compatible storage is required');
  }
}

function createBrowserMigrationRecoveryCheckpoint(storage) {
  assertStorage(storage);
  const legacyValue = storage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  const gameStateSaveValue = storage.getItem(DEFAULT_STORAGE_KEY);

  return Object.freeze({
    kind: 'browser-migration-recovery-checkpoint',
    version: 1,
    legacyStorageKey: LEGACY_LOCAL_STORAGE_KEY,
    gameStateStorageKey: DEFAULT_STORAGE_KEY,
    legacyValue,
    gameStateSaveValue,
    verified:
      storage.getItem(LEGACY_LOCAL_STORAGE_KEY) === legacyValue &&
      storage.getItem(DEFAULT_STORAGE_KEY) === gameStateSaveValue
  });
}

function restoreBrowserMigrationRecoveryCheckpoint(storage, checkpoint) {
  assertStorage(storage);
  if (!checkpoint || checkpoint.kind !== 'browser-migration-recovery-checkpoint' || checkpoint.version !== 1 || checkpoint.verified !== true) {
    throw new Error('Verified browser migration recovery checkpoint is required');
  }

  if (checkpoint.legacyValue === null) storage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  else storage.setItem(LEGACY_LOCAL_STORAGE_KEY, checkpoint.legacyValue);

  if (checkpoint.gameStateSaveValue === null) storage.removeItem(DEFAULT_STORAGE_KEY);
  else storage.setItem(DEFAULT_STORAGE_KEY, checkpoint.gameStateSaveValue);

  const restored =
    storage.getItem(LEGACY_LOCAL_STORAGE_KEY) === checkpoint.legacyValue &&
    storage.getItem(DEFAULT_STORAGE_KEY) === checkpoint.gameStateSaveValue;

  if (!restored) throw new Error('Browser migration recovery checkpoint restoration failed');

  return Object.freeze({
    kind: 'browser-migration-recovery-restoration',
    version: 1,
    restored: true,
    legacyRestored: true,
    gameStateSaveStoreRestored: true,
    activationPerformed: false,
    sourceDeletionAllowed: false
  });
}

module.exports = {
  createBrowserMigrationRecoveryCheckpoint,
  restoreBrowserMigrationRecoveryCheckpoint
};
