'use strict';

async function evaluateFrontOfficeGameStateActivationReadiness(frontOfficeAdapter, isolatedVerification) {
  const blockers = [];

  if (!frontOfficeAdapter || frontOfficeAdapter.kind !== 'front-office-read-only-runtime-adapter' ||
      typeof frontOfficeAdapter.readLegacySnapshot !== 'function') {
    blockers.push('Read-only Front Office runtime adapter is required');
  }

  if (!isolatedVerification || isolatedVerification.kind !== 'isolated-gamestate-activation-verification') {
    blockers.push('Isolated GameState activation verification is required');
  } else {
    if (isolatedVerification.verified !== true) blockers.push(...isolatedVerification.blockers);
    if (isolatedVerification.stateMatches !== true) blockers.push('Verified isolated GameState match is required');
    if (isolatedVerification.frontOfficeActivationPerformed !== false) {
      blockers.push('Front Office must not already be activated');
    }
    if (!isolatedVerification.slotId) blockers.push('Verified GameState slot ID is required');
  }

  let legacySnapshot = null;
  if (!blockers.length) {
    try {
      legacySnapshot = await frontOfficeAdapter.readLegacySnapshot();
    } catch (error) {
      blockers.push('Front Office legacy snapshot could not be read');
    }
  }

  return Object.freeze({
    kind: 'front-office-gamestate-activation-readiness',
    version: 1,
    ready: blockers.length === 0,
    slotId: isolatedVerification && isolatedVerification.slotId || null,
    isolatedActivationVerified: Boolean(isolatedVerification && isolatedVerification.verified),
    legacyRuntimeReadable: legacySnapshot !== null,
    legacyRuntimeReadOnly: true,
    gameStateSourceOfTruthAuthorized: false,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    legacySourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { evaluateFrontOfficeGameStateActivationReadiness };
