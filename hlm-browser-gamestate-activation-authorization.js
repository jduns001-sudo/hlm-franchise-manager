'use strict';

const GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE = 'AUTHORIZE_BROWSER_GAMESTATE_ACTIVATION';

function authorizeBrowserGameStateActivation(readiness, authorization) {
  const blockers = [];

  if (!readiness || readiness.kind !== 'browser-gamestate-activation-readiness') {
    blockers.push('GameState activation readiness result is required');
  } else {
    if (readiness.ready !== true) blockers.push(...readiness.blockers);
    if (readiness.gameStateVerified !== true) blockers.push('Verified GameState is required');
    if (readiness.checkpointVerified !== true) blockers.push('Verified recovery checkpoint is required');
    if (readiness.activationPerformed !== false) blockers.push('GameState must not already be activated');
    if (!readiness.slotId) blockers.push('Verified save slot ID is required');
  }

  const authorizationRequested = authorization === GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE;
  if (!blockers.length && !authorizationRequested) {
    blockers.push('Explicit GameState activation authorization required');
  }

  const authorized = blockers.length === 0 && authorizationRequested;

  return Object.freeze({
    kind: 'browser-gamestate-activation-authorization',
    version: 1,
    ready: Boolean(readiness && readiness.ready === true),
    authorizationRequested,
    authorized,
    activationAllowed: authorized,
    activationPerformed: false,
    slotId: readiness && readiness.slotId || null,
    gameStateVerified: Boolean(readiness && readiness.gameStateVerified),
    checkpointVerified: Boolean(readiness && readiness.checkpointVerified),
    state: authorized ? readiness.state : null,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = {
  GAMESTATE_ACTIVATION_AUTHORIZATION_PHRASE,
  authorizeBrowserGameStateActivation
};
