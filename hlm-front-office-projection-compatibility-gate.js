'use strict';

const REQUIRED_COLLECTIONS = Object.freeze([
  'players', 'teams', 'contracts', 'draftPicks', 'transactions'
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

function verifyFrontOfficeProjectionCompatibility(legacySnapshot, projectedSnapshot) {
  if (!legacySnapshot || typeof legacySnapshot !== 'object' || Array.isArray(legacySnapshot)) {
    throw new TypeError('Legacy Front Office snapshot is required');
  }
  if (!projectedSnapshot || typeof projectedSnapshot !== 'object' || Array.isArray(projectedSnapshot)) {
    throw new TypeError('Projected GameState Front Office snapshot is required');
  }

  const blockers = [];
  const collectionChecks = {};

  for (const key of REQUIRED_COLLECTIONS) {
    const legacyIsArray = Array.isArray(legacySnapshot[key]);
    const projectedIsArray = Array.isArray(projectedSnapshot[key]);
    const legacyCount = legacyIsArray ? legacySnapshot[key].length : null;
    const projectedCount = projectedIsArray ? projectedSnapshot[key].length : null;
    const compatible = legacyIsArray && projectedIsArray && legacyCount === projectedCount;

    collectionChecks[key] = Object.freeze({
      legacyIsArray,
      projectedIsArray,
      legacyCount,
      projectedCount,
      compatible
    });

    if (!legacyIsArray) blockers.push(`Legacy snapshot ${key} collection is missing or invalid`);
    if (!projectedIsArray) blockers.push(`Projected snapshot ${key} collection is missing or invalid`);
    if (legacyIsArray && projectedIsArray && legacyCount !== projectedCount) {
      blockers.push(`${key} collection count differs between legacy and projected snapshots`);
    }
  }

  const legacyControlledTeamId = controlledTeamId(legacySnapshot);
  const projectedControlledTeamId = controlledTeamId(projectedSnapshot);
  const controlledTeamMatches = legacyControlledTeamId === projectedControlledTeamId;
  if (!controlledTeamMatches) blockers.push('Controlled team differs between legacy and projected snapshots');

  return Object.freeze({
    kind: 'front-office-projection-compatibility-verification',
    version: 1,
    compatible: blockers.length === 0,
    collectionChecks: Object.freeze(collectionChecks),
    legacyControlledTeamId,
    projectedControlledTeamId,
    controlledTeamMatches,
    frontOfficeCutoverAllowed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { verifyFrontOfficeProjectionCompatibility };
