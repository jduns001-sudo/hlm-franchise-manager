'use strict';

const { createGameStateEnvelope, validateGameStateEnvelope } = require('./hlm-game-state');

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function transformSchema7ToGameState(snapshot, meta = {}) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('Schema 7 snapshot is required');
  if (snapshot.schema !== 7) throw new Error('Only Front Office schema 7 is supported');

  const settings = snapshot.settings && typeof snapshot.settings === 'object' ? snapshot.settings : {};
  const controlledTeamId = meta.controlledTeamId ?? settings.controlledTeamId ?? settings.controlTeamId ?? null;

  const state = createGameStateEnvelope({
    meta: { ...meta, controlledTeamId },
    prospects: Array.isArray(snapshot.prospects) ? snapshot.prospects : [],
    contracts: Array.isArray(snapshot.contracts) ? snapshot.contracts : [],
    draftPicks: Array.isArray(snapshot.draftPicks) ? snapshot.draftPicks : [],
    transactions: Array.isArray(snapshot.transactions) ? snapshot.transactions : [],
    history: Array.isArray(snapshot.history) ? snapshot.history : [],
    extensions: {
      frontOfficeSchema7: clone(snapshot),
      migration: { sourceSchema: 7, sourcePreserved: true }
    }
  });

  const validation = validateGameStateEnvelope(state);
  return Object.freeze({
    state,
    validation,
    sourcePreserved: JSON.stringify(snapshot) === JSON.stringify(state.extensions.frontOfficeSchema7),
    destructive: false
  });
}

module.exports = { transformSchema7ToGameState };
