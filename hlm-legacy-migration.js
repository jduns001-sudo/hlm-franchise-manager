'use strict';

const { createGameStateEnvelope } = require('./hlm-game-state');

const LEGACY_LOCAL_STORAGE_KEY = 'hlm_tracker_v3';

function inspectLegacyFrontOfficeState(legacy) {
  const source = legacy && typeof legacy === 'object' && !Array.isArray(legacy) ? legacy : {};
  const arrayFields = ['players', 'teams', 'seasons', 'awards', 'transactions', 'draftPicks', 'prospects', 'draftClasses', 'contracts'];
  const counts = {};
  const missingOrInvalidArrays = [];

  for (const field of arrayFields) {
    if (Array.isArray(source[field])) counts[field] = source[field].length;
    else {
      counts[field] = 0;
      missingOrInvalidArrays.push(field);
    }
  }

  return {
    legacyStorageKey: LEGACY_LOCAL_STORAGE_KEY,
    counts,
    missingOrInvalidArrays,
    hasGmSettings: !!source.gmSettings && typeof source.gmSettings === 'object',
    hasSnapshot: !!source.snapshot && typeof source.snapshot === 'object',
    franchiseName: typeof source.franchiseName === 'string' ? source.franchiseName : null
  };
}

function planLegacyMigration(legacy) {
  const inspection = inspectLegacyFrontOfficeState(legacy);
  return {
    inspection,
    mappings: {
      players: 'universe.players',
      teams: 'universe.teams',
      prospects: 'universe.prospects',
      contracts: 'assets.contracts',
      draftPicks: 'assets.draftPicks',
      transactions: 'activity.transactions',
      seasons: 'history.seasons'
    },
    deferred: ['awards', 'draftClasses', 'gmSettings', 'snapshot', 'franchiseName'],
    warnings: inspection.missingOrInvalidArrays.map(field => ({
      code: 'LEGACY_FIELD_NOT_ARRAY',
      field
    })),
    destructive: false
  };
}

function createLegacyMigrationPreview(legacy, meta = {}) {
  const source = legacy && typeof legacy === 'object' && !Array.isArray(legacy) ? legacy : {};
  const plan = planLegacyMigration(source);
  const state = createGameStateEnvelope({
    meta,
    players: Array.isArray(source.players) ? source.players : [],
    teams: Array.isArray(source.teams) ? source.teams : [],
    prospects: Array.isArray(source.prospects) ? source.prospects : [],
    contracts: Array.isArray(source.contracts) ? source.contracts : [],
    draftPicks: Array.isArray(source.draftPicks) ? source.draftPicks : [],
    transactions: Array.isArray(source.transactions) ? source.transactions : [],
    seasons: Array.isArray(source.seasons) ? source.seasons : []
  });

  return { plan, state };
}

module.exports = {
  LEGACY_LOCAL_STORAGE_KEY,
  inspectLegacyFrontOfficeState,
  planLegacyMigration,
  createLegacyMigrationPreview
};
