'use strict';

const { createSaveEnvelope, serializeSaveEnvelope, loadSaveEnvelope } = require('./hlm-save-envelope');

const EXPORT_FORMAT = 'HFM_EXPORT';
const EXPORT_FORMAT_VERSION = 1;

function exportGameState(state, metadata = {}) {
  const saveEnvelope = createSaveEnvelope(state, metadata);
  return JSON.stringify({
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: metadata.exportedAt || null,
    save: saveEnvelope
  });
}

function inspectGameStateImport(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { valid: false, error: { code: 'INVALID_IMPORT_TEXT' } };
  }

  let wrapper;
  try {
    wrapper = JSON.parse(text);
  } catch (cause) {
    return { valid: false, error: { code: 'INVALID_IMPORT_JSON', message: cause.message } };
  }

  if (!wrapper || wrapper.format !== EXPORT_FORMAT || wrapper.formatVersion !== EXPORT_FORMAT_VERSION) {
    return { valid: false, error: { code: 'UNSUPPORTED_EXPORT_FORMAT' } };
  }

  try {
    const loaded = loadSaveEnvelope(wrapper.save);
    return {
      valid: true,
      exportedAt: wrapper.exportedAt || null,
      metadata: { ...loaded.envelope.metadata },
      state: loaded.state,
      saveEnvelope: loaded.envelope
    };
  } catch (error) {
    return { valid: false, error: { code: error.code || 'INVALID_IMPORTED_SAVE', message: error.message } };
  }
}

function importGameState(text) {
  const inspection = inspectGameStateImport(text);
  if (!inspection.valid) {
    const error = new Error(inspection.error.message || 'GameState import failed validation');
    error.code = inspection.error.code;
    throw error;
  }
  return inspection;
}

function exportSaveEnvelope(saveEnvelope, exportedAt = null) {
  loadSaveEnvelope(saveEnvelope);
  return JSON.stringify({
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt,
    save: saveEnvelope
  });
}

module.exports = {
  EXPORT_FORMAT,
  EXPORT_FORMAT_VERSION,
  exportGameState,
  exportSaveEnvelope,
  inspectGameStateImport,
  importGameState
};
