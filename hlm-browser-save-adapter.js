'use strict';

const { createSaveEnvelope, serializeSaveEnvelope, loadSaveEnvelope } = require('./hlm-save-envelope');

const DEFAULT_STORAGE_KEY = 'hfm_game_state_saves_v1';

function createBrowserSaveAdapter(storage, storageKey = DEFAULT_STORAGE_KEY) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
    throw Object.assign(new Error('Storage adapter requires Web Storage-compatible methods'), { code: 'INVALID_STORAGE_ADAPTER' });
  }

  function readStore() {
    const raw = storage.getItem(storageKey);
    if (!raw) return {};
    let store;
    try { store = JSON.parse(raw); }
    catch (cause) {
      const error = new Error('Browser save index is invalid JSON');
      error.code = 'INVALID_BROWSER_SAVE_INDEX';
      error.cause = cause;
      throw error;
    }
    if (!store || typeof store !== 'object' || Array.isArray(store)) {
      throw Object.assign(new Error('Browser save index is invalid'), { code: 'INVALID_BROWSER_SAVE_INDEX' });
    }
    return store;
  }

  function writeStore(store) {
    storage.setItem(storageKey, JSON.stringify(store));
  }

  return {
    storageKey,

    save(slotId, state, metadata = {}, options = {}) {
      if (typeof slotId !== 'string' || !slotId.trim()) throw Object.assign(new Error('Save slot ID is required'), { code: 'INVALID_SAVE_SLOT_ID' });
      const id = slotId.trim();
      const store = readStore();
      if (Object.prototype.hasOwnProperty.call(store, id) && !options.replace) {
        throw Object.assign(new Error('Save slot already exists'), { code: 'SAVE_SLOT_EXISTS', slotId: id });
      }
      const envelope = createSaveEnvelope(state, metadata);
      store[id] = serializeSaveEnvelope(envelope);
      writeStore(store);
      return { slotId: id, metadata: { ...envelope.metadata } };
    },

    list() {
      const store = readStore();
      return Object.keys(store).map(slotId => {
        const loaded = loadSaveEnvelope(store[slotId]);
        return { slotId, metadata: { ...loaded.envelope.metadata } };
      });
    },

    load(slotId) {
      const id = String(slotId || '').trim();
      const store = readStore();
      if (!Object.prototype.hasOwnProperty.call(store, id)) throw Object.assign(new Error('Save slot not found'), { code: 'SAVE_SLOT_NOT_FOUND', slotId: id });
      return loadSaveEnvelope(store[id]);
    },

    remove(slotId) {
      const id = String(slotId || '').trim();
      const store = readStore();
      if (!Object.prototype.hasOwnProperty.call(store, id)) throw Object.assign(new Error('Save slot not found'), { code: 'SAVE_SLOT_NOT_FOUND', slotId: id });
      delete store[id];
      if (Object.keys(store).length) writeStore(store);
      else storage.removeItem(storageKey);
      return { slotId: id, removed: true };
    },

    has(slotId) {
      return Object.prototype.hasOwnProperty.call(readStore(), String(slotId || '').trim());
    }
  };
}

module.exports = { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter };
