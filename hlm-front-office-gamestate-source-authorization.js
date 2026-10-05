'use strict';

const FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE = 'AUTHORIZE_GAMESTATE_AS_FRONT_OFFICE_SOURCE';

function authorizeFrontOfficeGameStateSource(readiness, authorization) {
  const blockers = [];

  if (!readiness || readiness.kind !== 'front-office-gamestate-activation-readiness') {
    blockers.push('Front Office GameState activation readiness result is required');
  } else {
    if (readiness.ready !== true) blockers.push(...readiness.blockers);
    if (readiness.isolatedActivationVerified !== true) blockers.push('Verified isolated activation is required');
    if (readiness.legacyRuntimeReadable !== true) blockers.push('Readable legacy Front Office runtime is required');
    if (readiness.legacyRuntimeReadOnly !== true) blockers.push('Legacy Front Office runtime must remain read-only');
    if (readiness.frontOfficeActivationPerformed !== false) blockers.push('Front Office must not already be activated');
    if (!readiness.slotId) blockers.push('Verified GameState slot ID is required');
  }

  const authorizationRequested = authorization === FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE;
  if (!blockers.length && !authorizationRequested) {
    blockers.push('Explicit Front Office GameState source authorization required');
  }

  const authorized = blockers.length === 0 && authorizationRequested;

  return Object.freeze({
    kind: 'front-office-gamestate-source-authorization',
    version: 1,
    ready: Boolean(readiness && readiness.ready === true),
    authorizationRequested,
    authorized,
    gameStateSourceOfTruthAuthorized: authorized,
    frontOfficeActivationAllowed: authorized,
    frontOfficeActivationPerformed: false,
    slotId: readiness && readiness.slotId || null,
    isolatedActivationVerified: Boolean(readiness && readiness.isolatedActivationVerified),
    legacyRuntimeReadable: Boolean(readiness && readiness.legacyRuntimeReadable),
    legacyRuntimeReadOnly: true,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = {
  FRONT_OFFICE_GAMESTATE_SOURCE_AUTHORIZATION_PHRASE,
  authorizeFrontOfficeGameStateSource
};
