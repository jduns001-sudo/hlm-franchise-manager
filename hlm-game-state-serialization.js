'use strict';

const { GAME_STATE_SCHEMA_VERSION, validateGameStateEnvelope } = require('./hlm-game-state');

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stableSort(value[key]);
      return out;
    }, {});
  }
  return value;
}

function serializeGameState(state) {
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Cannot serialize invalid GameState');
    error.code = 'INVALID_GAME_STATE';
    error.validation = validation;
    throw error;
  }
  return JSON.stringify(stableSort(state));
}

function deserializeGameState(serialized) {
  if (typeof serialized !== 'string' || !serialized.trim()) {
    const error = new Error('Serialized GameState must be non-empty JSON text');
    error.code = 'INVALID_SAVE_TEXT';
    throw error;
  }

  let state;
  try {
    state = JSON.parse(serialized);
  } catch (cause) {
    const error = new Error('Serialized GameState is not valid JSON');
    error.code = 'INVALID_SAVE_JSON';
    error.cause = cause;
    throw error;
  }

  if (state && state.schemaVersion !== GAME_STATE_SCHEMA_VERSION) {
    const error = new Error('Unsupported GameState schema version');
    error.code = 'UNSUPPORTED_SCHEMA_VERSION';
    error.schemaVersion = state.schemaVersion;
    throw error;
  }

  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new Error('Loaded GameState failed structural validation');
    error.code = 'INVALID_GAME_STATE';
    error.validation = validation;
    throw error;
  }

  return state;
}

function verifyGameStateRoundTrip(state) {
  const first = serializeGameState(state);
  const loaded = deserializeGameState(first);
  const second = serializeGameState(loaded);
  return {
    valid: first === second,
    serialized: first,
    loaded,
    byteLength: typeof Buffer !== 'undefined' ? Buffer.byteLength(first, 'utf8') : first.length
  };
}

module.exports = {
  serializeGameState,
  deserializeGameState,
  verifyGameStateRoundTrip
};
