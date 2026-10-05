'use strict';

const { projectGameStateForFrontOffice } = require('./hlm-front-office-gamestate-projection');

function same(valueA, valueB) {
  return JSON.stringify(valueA) === JSON.stringify(valueB);
}

async function runFrontOfficeCutoverDryRun(options = {}) {
  const legacyAdapter = options.legacyAdapter;
  const guardedSelector = options.guardedSelector;
  const expectedProjection = options.expectedProjection;

  if (!legacyAdapter || legacyAdapter.kind !== 'front-office-read-only-runtime-adapter' ||
      typeof legacyAdapter.readLegacySnapshot !== 'function') {
    throw new TypeError('Read-only Front Office legacy adapter is required');
  }
  if (!guardedSelector || guardedSelector.kind !== 'bound-front-office-source-selector-guard' ||
      typeof guardedSelector.read !== 'function' || typeof guardedSelector.selectGameState !== 'function' ||
      typeof guardedSelector.rollbackToLegacy !== 'function') {
    throw new TypeError('Bound Front Office source selector guard is required');
  }
  if (!expectedProjection || typeof expectedProjection !== 'object' || Array.isArray(expectedProjection)) {
    throw new TypeError('Expected Front Office GameState projection is required');
  }

  const blockers = [];
  let legacyBefore = null;
  let projectedRead = null;
  let legacyAfter = null;
  let selection = null;
  let rollback = null;

  if (guardedSelector.source !== 'legacy') blockers.push('Dry run must begin on legacy source');

  try {
    if (!blockers.length) {
      legacyBefore = await legacyAdapter.readLegacySnapshot();
      selection = guardedSelector.selectGameState();
      const centralStateRead = await guardedSelector.read();
      projectedRead = projectGameStateForFrontOffice(centralStateRead);

      if (!same(projectedRead, expectedProjection)) {
        blockers.push('Projected GameState read does not match expected Front Office projection');
      }
    }
  } catch (error) {
    blockers.push(error && error.message ? error.message : 'Front Office cutover dry run failed');
  } finally {
    if (guardedSelector.source === 'gamestate') {
      try {
        rollback = guardedSelector.rollbackToLegacy();
      } catch (error) {
        blockers.push(error && error.message ? error.message : 'Front Office dry-run rollback failed');
      }
    }
  }

  if (guardedSelector.source !== 'legacy') {
    blockers.push('Dry run did not finish on legacy source');
  } else if (legacyBefore !== null) {
    try {
      legacyAfter = await guardedSelector.read();
      if (!same(legacyAfter, legacyBefore)) {
        blockers.push('Legacy Front Office snapshot changed after dry-run rollback');
      }
    } catch (error) {
      blockers.push(error && error.message ? error.message : 'Legacy verification after dry-run rollback failed');
    }
  }

  return Object.freeze({
    kind: 'front-office-cutover-dry-run',
    version: 1,
    verified: blockers.length === 0,
    slotId: guardedSelector.slotId || null,
    beganOnLegacy: legacyBefore !== null,
    exactCandidateSelected: Boolean(selection && selection.exactCandidateVerified),
    projectionMatched: projectedRead !== null && same(projectedRead, expectedProjection),
    rollbackPerformed: Boolean(rollback && rollback.rolledBack),
    legacyRestored: legacyAfter !== null && same(legacyAfter, legacyBefore),
    finalSource: guardedSelector.source,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWritePerformed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { runFrontOfficeCutoverDryRun };
