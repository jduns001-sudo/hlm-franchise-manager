'use strict';

const { serializeGameState, deserializeGameState } = require('./hlm-game-state-serialization');

const SAVE_FORMAT = 'HFM_SAVE';
const SAVE_FORMAT_VERSION = 1;

function hashText(text) {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h1 ^= text.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0');
}

function createSaveEnvelope(state, metadata = {}) {
  const payload = serializeGameState(state);
  return {
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
    metadata: {
      saveId: metadata.saveId || (state.meta && state.meta.saveId) || null,
      label: metadata.label || null,
      createdAt: metadata.createdAt || null,
      updatedAt: metadata.updatedAt || null,
      gameDate: metadata.gameDate || (state.meta && state.meta.currentDate) || null,
      controlledTeamId: metadata.controlledTeamId ?? (state.meta && state.meta.controlledTeamId) ?? null
    },
    integrity: {
      algorithm: 'fnv1a32',
      payloadHash: hashText(payload)
    },
    payload
  };
}

function serializeSaveEnvelope(envelope) {
  return JSON.stringify(envelope);
}

function loadSaveEnvelope(input) {
  const envelope = typeof input === 'string' ? JSON.parse(input) : input;
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw Object.assign(new Error('Save envelope must be an object'), { code: 'INVALID_SAVE_ENVELOPE' });
  }
  if (envelope.format !== SAVE_FORMAT || envelope.formatVersion !== SAVE_FORMAT_VERSION) {
    throw Object.assign(new Error('Unsupported save envelope format'), { code: 'UNSUPPORTED_SAVE_FORMAT' });
  }
  if (!envelope.integrity || envelope.integrity.algorithm !== 'fnv1a32' || typeof envelope.payload !== 'string') {
    throw Object.assign(new Error('Save envelope integrity metadata is invalid'), { code: 'INVALID_SAVE_INTEGRITY' });
  }
  const actual = hashText(envelope.payload);
  if (actual !== envelope.integrity.payloadHash) {
    throw Object.assign(new Error('Save payload integrity check failed'), { code: 'SAVE_INTEGRITY_MISMATCH' });
  }
  return {
    envelope,
    state: deserializeGameState(envelope.payload)
  };
}

module.exports = {
  SAVE_FORMAT,
  SAVE_FORMAT_VERSION,
  hashText,
  createSaveEnvelope,
  serializeSaveEnvelope,
  loadSaveEnvelope
};
