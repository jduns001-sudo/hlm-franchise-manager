'use strict';

const { createBrowserSaveAdapter, DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { GAME_STATE_SCHEMA_VERSION, validateGameStateEnvelope } = require('./hlm-game-state');
const { verifyGameStateRoundTrip } = require('./hlm-game-state-serialization');

function loadVerifiedBrowserGameState(storage, slotId) {
  const blockers = [];
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
    blockers.push('Web Storage-compatible storage is required');
  }

  const normalizedSlotId = typeof slotId === 'string' ? slotId.trim() : '';
  if (!normalizedSlotId) blockers.push('Save slot ID is required');

  if (blockers.length) {
    return Object.freeze({
      kind: 'verified-browser-game-state-load',
      version: 1,
      loaded: false,
      verified: false,
      slotId: normalizedSlotId || null,
      storageKey: DEFAULT_STORAGE_KEY,
      schemaVersion: null,
      state: null,
      writePerformed: false,
      sourceMutationAllowed: false,
      sourceDeletionAllowed: false,
      blockers: Object.freeze(blockers)
    });
  }

  const legacyBefore = storage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  const targetBefore = storage.getItem(DEFAULT_STORAGE_KEY);

  try {
    const repository = createBrowserSaveAdapter(storage, DEFAULT_STORAGE_KEY);
    const loaded = repository.load(normalizedSlotId);
    const validation = validateGameStateEnvelope(loaded.state);
    if (!validation.valid) throw new Error('Loaded GameState failed structural validation');
    if (loaded.state.schemaVersion !== GAME_STATE_SCHEMA_VERSION) throw new Error('Unsupported GameState schema version');

    const roundTrip = verifyGameStateRoundTrip(loaded.state);
    if (!roundTrip.valid) throw new Error('Loaded GameState round-trip verification failed');

    if (storage.getItem(LEGACY_LOCAL_STORAGE_KEY) !== legacyBefore || storage.getItem(DEFAULT_STORAGE_KEY) !== targetBefore) {
      throw new Error('Browser storage changed during verified load');
    }

    return Object.freeze({
      kind: 'verified-browser-game-state-load',
      version: 1,
      loaded: true,
      verified: true,
      slotId: normalizedSlotId,
      storageKey: DEFAULT_STORAGE_KEY,
      schemaVersion: loaded.state.schemaVersion,
      state: loaded.state,
      metadata: Object.freeze({ ...(loaded.envelope.metadata || {}) }),
      writePerformed: false,
      sourceMutationAllowed: false,
      sourceDeletionAllowed: false,
      blockers: Object.freeze([])
    });
  } catch (error) {
    return Object.freeze({
      kind: 'verified-browser-game-state-load',
      version: 1,
      loaded: false,
      verified: false,
      slotId: normalizedSlotId,
      storageKey: DEFAULT_STORAGE_KEY,
      schemaVersion: null,
      state: null,
      writePerformed: false,
      sourceMutationAllowed: false,
      sourceDeletionAllowed: false,
      blockers: Object.freeze([error && error.message ? error.message : 'Verified browser GameState load failed'])
    });
  }
}

module.exports = { loadVerifiedBrowserGameState };
