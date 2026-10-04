'use strict';

const { createSaveEnvelope, serializeSaveEnvelope, loadSaveEnvelope } = require('./hlm-save-envelope');

function requireSlotId(slotId) {
  if (typeof slotId !== 'string' || !slotId.trim()) {
    throw Object.assign(new Error('Save slot ID is required'), { code: 'INVALID_SAVE_SLOT_ID' });
  }
  return slotId.trim();
}

function createMemorySaveRepository() {
  const slots = new Map();

  return {
    save(slotId, state, metadata = {}, options = {}) {
      const id = requireSlotId(slotId);
      if (slots.has(id) && !options.replace) {
        throw Object.assign(new Error('Save slot already exists'), { code: 'SAVE_SLOT_EXISTS', slotId: id });
      }
      const envelope = createSaveEnvelope(state, metadata);
      const text = serializeSaveEnvelope(envelope);
      slots.set(id, text);
      return { slotId: id, metadata: { ...envelope.metadata } };
    },

    list() {
      return Array.from(slots.entries()).map(([slotId, text]) => {
        const loaded = loadSaveEnvelope(text);
        return { slotId, metadata: { ...loaded.envelope.metadata } };
      });
    },

    load(slotId) {
      const id = requireSlotId(slotId);
      if (!slots.has(id)) {
        throw Object.assign(new Error('Save slot not found'), { code: 'SAVE_SLOT_NOT_FOUND', slotId: id });
      }
      return loadSaveEnvelope(slots.get(id));
    },

    remove(slotId) {
      const id = requireSlotId(slotId);
      if (!slots.has(id)) {
        throw Object.assign(new Error('Save slot not found'), { code: 'SAVE_SLOT_NOT_FOUND', slotId: id });
      }
      slots.delete(id);
      return { slotId: id, removed: true };
    },

    has(slotId) {
      return slots.has(requireSlotId(slotId));
    },

    count() {
      return slots.size;
    }
  };
}

module.exports = { createMemorySaveRepository };
