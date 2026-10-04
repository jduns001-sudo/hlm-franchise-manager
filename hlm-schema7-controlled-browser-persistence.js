'use strict';

const { createBrowserSaveAdapter, DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const { transformSchema7ToGameState } = require('./hlm-schema7-gamestate-transform');
const { verifyGameStateRoundTrip } = require('./hlm-game-state-serialization');
const { evaluateSchema7BrowserPersistencePreflight } = require('./hlm-schema7-browser-persistence-preflight');

async function executeSchema7ControlledBrowserPersistence(storage, slotId, snapshot, authorization, options = {}) {
  const preflight = evaluateSchema7BrowserPersistencePreflight(storage, slotId, snapshot, authorization, options);
  if (!preflight.ready) {
    return Object.freeze({
      kind: 'schema7-controlled-browser-persistence',
      version: 1,
      executed: false,
      persisted: false,
      verified: false,
      rolledBack: false,
      slotId: preflight.slotId,
      storageKey: DEFAULT_STORAGE_KEY,
      sourcePreserved: preflight.sourcePreserved,
      sourceMutationAllowed: false,
      sourceDeletionAllowed: false,
      blockers: preflight.blockers
    });
  }

  const legacyBefore = storage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  const targetBefore = storage.getItem(DEFAULT_STORAGE_KEY);
  const repository = createBrowserSaveAdapter(storage, DEFAULT_STORAGE_KEY);

  try {
    const transformed = transformSchema7ToGameState(snapshot, options.meta || {});
    const roundTrip = verifyGameStateRoundTrip(transformed.state);
    if (!transformed.validation.valid || !transformed.sourcePreserved || !roundTrip.valid) {
      throw new Error('GameState failed controlled persistence verification');
    }

    repository.save(preflight.slotId, transformed.state, options.meta || {});
    const loaded = repository.load(preflight.slotId);
    const persistedRoundTrip = verifyGameStateRoundTrip(loaded.state);
    if (!persistedRoundTrip.valid) throw new Error('Persisted GameState verification failed');
    if (storage.getItem(LEGACY_LOCAL_STORAGE_KEY) !== legacyBefore) {
      throw new Error('Legacy Front Office localStorage changed during controlled persistence');
    }

    return Object.freeze({
      kind: 'schema7-controlled-browser-persistence',
      version: 1,
      executed: true,
      persisted: true,
      verified: true,
      rolledBack: false,
      slotId: preflight.slotId,
      storageKey: DEFAULT_STORAGE_KEY,
      sourcePreserved: true,
      sourceMutationAllowed: false,
      sourceDeletionAllowed: false,
      blockers: Object.freeze([])
    });
  } catch (error) {
    if (targetBefore === null) storage.removeItem(DEFAULT_STORAGE_KEY);
    else storage.setItem(DEFAULT_STORAGE_KEY, targetBefore);

    return Object.freeze({
      kind: 'schema7-controlled-browser-persistence',
      version: 1,
      executed: true,
      persisted: false,
      verified: false,
      rolledBack: true,
      slotId: preflight.slotId,
      storageKey: DEFAULT_STORAGE_KEY,
      sourcePreserved: storage.getItem(LEGACY_LOCAL_STORAGE_KEY) === legacyBefore,
      sourceMutationAllowed: false,
      sourceDeletionAllowed: false,
      blockers: Object.freeze([error && error.message ? error.message : 'Controlled browser persistence failed'])
    });
  }
}

module.exports = { executeSchema7ControlledBrowserPersistence };
