'use strict';

function canonical(value) {
  return JSON.stringify(value, Object.keys(value || {}).sort());
}

async function verifyFrontOfficeSourceSelectorTransaction(selector, expectedLegacyState, expectedGameState) {
  const blockers = [];

  if (!selector || selector.kind !== 'reversible-front-office-source-selector' ||
      typeof selector.read !== 'function' || typeof selector.selectGameState !== 'function' ||
      typeof selector.rollbackToLegacy !== 'function') {
    throw new TypeError('Reversible Front Office source selector is required');
  }

  if (selector.source !== 'legacy') blockers.push('Source selector must begin on legacy');

  let legacyBefore = null;
  let gameStateRead = null;
  let legacyAfter = null;
  let selected = null;
  let rolledBack = null;

  if (!blockers.length) {
    legacyBefore = await selector.read();
    if (JSON.stringify(legacyBefore) !== JSON.stringify(expectedLegacyState)) {
      blockers.push('Initial legacy snapshot does not match expected legacy state');
    }
  }

  if (!blockers.length) {
    selected = selector.selectGameState();
    gameStateRead = await selector.read();
    if (JSON.stringify(gameStateRead) !== JSON.stringify(expectedGameState)) {
      blockers.push('Selected GameState does not match expected GameState');
    }
  }

  if (selector.source === 'gamestate') {
    rolledBack = selector.rollbackToLegacy();
    legacyAfter = await selector.read();
    if (JSON.stringify(legacyAfter) !== JSON.stringify(expectedLegacyState)) {
      blockers.push('Legacy snapshot changed after GameState selection and rollback');
    }
  }

  return Object.freeze({
    kind: 'front-office-source-selector-transaction-verification',
    version: 1,
    verified: blockers.length === 0,
    slotId: selector.slotId || null,
    beganOnLegacy: legacyBefore !== null,
    gameStateSelected: Boolean(selected && selected.selected),
    gameStateMatched: gameStateRead !== null && JSON.stringify(gameStateRead) === JSON.stringify(expectedGameState),
    rollbackPerformed: Boolean(rolledBack && rolledBack.rolledBack),
    legacyRestored: legacyAfter !== null && JSON.stringify(legacyAfter) === JSON.stringify(expectedLegacyState),
    finalSource: selector.source,
    persistenceWritePerformed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { verifyFrontOfficeSourceSelectorTransaction };
