'use strict';

const { projectGameStateForFrontOffice } = require('./hlm-front-office-gamestate-projection');

const CORE_COLLECTIONS = Object.freeze([
  'players', 'teams', 'prospects', 'contracts', 'draftPicks', 'transactions'
]);

function controlledTeamId(snapshot) {
  if (snapshot && snapshot.gmSettings && snapshot.gmSettings.controlledTeamId != null) {
    return snapshot.gmSettings.controlledTeamId;
  }
  if (snapshot && snapshot.settings && snapshot.settings.controlledTeamId != null) {
    return snapshot.settings.controlledTeamId;
  }
  return null;
}

function verifyFrontOfficeProjectionCompatibility(legacySnapshot, gameState) {
  if (!legacySnapshot || typeof legacySnapshot !== 'object' || Array.isArray(legacySnapshot)) {
    throw new TypeError('Valid legacy Front Office snapshot is required');
  }

  const projected = projectGameStateForFrontOffice(gameState);
  const blockers = [];
  const collections = {};

  for (const key of CORE_COLLECTIONS) {
    const legacyValue = legacySnapshot[key];
    const projectedValue = projected[key];

    if (!Array.isArray(legacyValue)) {
      blockers.push({ code: 'LEGACY_COLLECTION_MISSING', collection: key });
      collections[key] = Object.freeze({ compatible: false, legacyCount: null, projectedCount: projectedValue.length });
      continue;
    }

    const compatible = JSON.stringify(legacyValue) === JSON.stringify(projectedValue);
    collections[key] = Object.freeze({
      compatible,
      legacyCount: legacyValue.length,
      projectedCount: projectedValue.length
    });

    if (!compatible) blockers.push({ code: 'COLLECTION_MISMATCH', collection: key });
  }

  const legacyControlledTeamId = controlledTeamId(legacySnapshot);
  const projectedControlledTeamId = controlledTeamId(projected);
  const controlledTeamCompatible = legacyControlledTeamId === projectedControlledTeamId;

  if (!controlledTeamCompatible) {
    blockers.push({
      code: 'CONTROLLED_TEAM_MISMATCH',
      legacyControlledTeamId,
      projectedControlledTeamId
    });
  }

  return Object.freeze({
    kind: 'front-office-projection-compatibility-verification',
    version: 1,
    compatible: blockers.length === 0,
    collections: Object.freeze(collections),
    controlledTeamCompatible,
    legacyControlledTeamId,
    projectedControlledTeamId,
    blockers: Object.freeze(blockers),
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWritePerformed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false
  });
}

module.exports = {
  CORE_COLLECTIONS,
  verifyFrontOfficeProjectionCompatibility
};
