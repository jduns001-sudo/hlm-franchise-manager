'use strict';

const { loadVerifiedBrowserGameState } = require('./hlm-verified-browser-gamestate-load');

function evaluateBrowserGameStateActivationReadiness(storage, slotId, migrationResult) {
  const blockers = [];

  if (!migrationResult || migrationResult.kind !== 'schema7-browser-migration-session-result') {
    blockers.push('Verified browser migration session result is required');
  } else {
    if (migrationResult.executed !== true) blockers.push('Browser migration session did not execute');
    if (migrationResult.persisted !== true) blockers.push('GameState was not persisted');
    if (migrationResult.verified !== true) blockers.push('Persisted GameState was not verified');
    if (migrationResult.checkpointCreated !== true) blockers.push('Verified recovery checkpoint is required');
    if (!migrationResult.checkpoint || migrationResult.checkpoint.verified !== true) {
      blockers.push('Recovery checkpoint verification is required');
    }
    if (migrationResult.activationPerformed !== false) blockers.push('Migration session must not already activate GameState');
  }

  let loaded = null;
  if (!blockers.length) {
    loaded = loadVerifiedBrowserGameState(storage, slotId);
    if (!loaded.loaded || !loaded.verified) blockers.push(...loaded.blockers);
  }

  const normalizedSlotId = typeof slotId === 'string' ? slotId.trim() : '';
  if (!normalizedSlotId) blockers.push('Save slot ID is required');

  return Object.freeze({
    kind: 'browser-gamestate-activation-readiness',
    version: 1,
    ready: blockers.length === 0,
    slotId: normalizedSlotId || null,
    gameStateVerified: Boolean(loaded && loaded.verified),
    checkpointVerified: Boolean(
      migrationResult &&
      migrationResult.checkpointCreated === true &&
      migrationResult.checkpoint &&
      migrationResult.checkpoint.verified === true
    ),
    activationAuthorized: false,
    activationPerformed: false,
    legacySourceDeletionAllowed: false,
    state: loaded && loaded.verified ? loaded.state : null,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { evaluateBrowserGameStateActivationReadiness };
