'use strict';

function evaluateFrontOfficeLiveCutoverReadiness(bindingVerification, dryRun) {
  const blockers = [];

  if (!bindingVerification ||
      bindingVerification.kind !== 'front-office-cutover-candidate-binding-verification') {
    blockers.push('Exact Front Office cutover candidate binding verification is required');
  } else {
    if (bindingVerification.verified !== true) blockers.push(...bindingVerification.blockers);
    if (bindingVerification.exactStateMatch !== true) blockers.push('Exact bound GameState candidate match is required');
    if (!bindingVerification.slotId) blockers.push('Bound GameState slot ID is required');
  }

  if (!dryRun || dryRun.kind !== 'front-office-cutover-dry-run') {
    blockers.push('Verified Front Office cutover dry run is required');
  } else {
    if (dryRun.verified !== true) blockers.push(...dryRun.blockers);
    if (dryRun.beganOnLegacy !== true) blockers.push('Cutover dry run must begin on legacy');
    if (dryRun.exactCandidateSelected !== true) blockers.push('Cutover dry run must select the exact bound candidate');
    if (dryRun.projectionMatched !== true) blockers.push('Front Office GameState projection must match');
    if (dryRun.rollbackPerformed !== true) blockers.push('Cutover dry run rollback is required');
    if (dryRun.legacyRestored !== true) blockers.push('Legacy Front Office restoration is required');
    if (dryRun.finalSource !== 'legacy') blockers.push('Cutover dry run must finish on legacy');
    if (!dryRun.slotId) blockers.push('Dry-run GameState slot ID is required');
  }

  const boundSlotId = bindingVerification && bindingVerification.slotId || null;
  const dryRunSlotId = dryRun && dryRun.slotId || null;
  if (boundSlotId && dryRunSlotId && boundSlotId !== dryRunSlotId) {
    blockers.push('Bound candidate and cutover dry-run slots do not match');
  }

  const ready = blockers.length === 0;

  return Object.freeze({
    kind: 'front-office-live-cutover-readiness',
    version: 1,
    ready,
    slotId: boundSlotId,
    exactCandidateVerified: Boolean(bindingVerification && bindingVerification.verified &&
      bindingVerification.exactStateMatch),
    dryRunVerified: Boolean(dryRun && dryRun.verified),
    rollbackVerified: Boolean(dryRun && dryRun.rollbackPerformed && dryRun.legacyRestored &&
      dryRun.finalSource === 'legacy'),
    projectionVerified: Boolean(dryRun && dryRun.projectionMatched),
    liveWiringMissionMayBePrepared: ready,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { evaluateFrontOfficeLiveCutoverReadiness };
