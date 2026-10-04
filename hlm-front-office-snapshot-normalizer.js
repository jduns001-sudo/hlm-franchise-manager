'use strict';

const SNAPSHOT_NORMALIZER_VERSION = 1;
const ARRAY_FIELDS = [
  'players','teams','prospects','contracts','draftPicks','transactions',
  'seasons','awards','draftClasses','lines','depth','waivers','history',
  'draftBoard','decisions','notes'
];

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeFrontOfficeSnapshot(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    const error = new Error('Front Office snapshot must be an object');
    error.code = 'INVALID_FRONT_OFFICE_SNAPSHOT';
    throw error;
  }

  const settings = clone(source.settings || source.gmSettings || {});
  const normalized = {
    schema: source.schema == null ? null : source.schema,
    settings,
    playerOverrides: clone(source.playerOverrides || {}),
    draftPickOverrides: clone(source.draftPickOverrides || {}),
    extraDraftPicks: clone(source.extraDraftPicks || []),
    customPlayers: clone(source.customPlayers || []),
    snapshot: clone(source.snapshot || null),
    franchiseName: source.franchiseName == null ? null : source.franchiseName
  };

  for (const field of ARRAY_FIELDS) {
    normalized[field] = Array.isArray(source[field]) ? clone(source[field]) : [];
  }

  return Object.freeze({
    kind: 'front-office-normalized-snapshot',
    version: SNAPSHOT_NORMALIZER_VERSION,
    readOnly: true,
    sourceSchema: normalized.schema,
    state: Object.freeze(normalized)
  });
}

module.exports = { SNAPSHOT_NORMALIZER_VERSION, normalizeFrontOfficeSnapshot };
