'use strict';

/**
 * Mission 732: conservative eligibility review of roster-backed rules previews.
 * No official result, state changes, storage, or gameplay authorization.
 */
const { createRosterGameRulesPreview } = require('./hlm-phase10-roster-game-rules-preview');

function assessRosterGamePreviewEligibility(state, homeTeamId, awayTeamId, seed = 1) {
  const preview = createRosterGameRulesPreview(state, homeTeamId, awayTeamId, seed);
  const blockers = [];
  if (!preview.previewAvailable) blockers.push('INCOMPLETE_STARTER_PROPOSALS');
  if (!preview.validation.valid) blockers.push('FRANCHISE_IDENTITY_DIAGNOSTICS');
  // Preview starter units do not prove legal rosters or league participation.
  blockers.push('LEAGUE_ELIGIBILITY_UNVERIFIED');
  blockers.push('PLAYER_CONTRACT_INJURY_STATUS_UNVERIFIED');
  blockers.push('LINEUP_AUTHORIZATION_NOT_IMPLEMENTED');
  blockers.push('OFFICIAL_RESULT_COMMIT_NOT_IMPLEMENTED');
  return {
    kind: 'phase10-roster-game-preview-eligibility-review',
    version: 1,
    homeTeamId,
    awayTeamId,
    seed,
    previewAvailable: preview.previewAvailable,
    calculatedResult: preview.calculatedResult ? { ...preview.calculatedResult } : null,
    homeMissingSlots: preview.homeMissingSlots.slice(),
    awayMissingSlots: preview.awayMissingSlots.slice(),
    blockers,
    blockerCount: blockers.length,
    validation: { ...preview.validation },
    gameReady: false,
    resultOfficial: false,
    authorizationIssued: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessRosterGamePreviewEligibility };
