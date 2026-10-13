'use strict';

/**
 * Mission 733: read-only, explicit gameplay integration dependency plan.
 * No gameplay execution, legal eligibility inference, or result commits.
 */
const { assessRosterGamePreviewEligibility } = require('./hlm-phase10-roster-game-preview-eligibility');

const REQUIREMENTS = Object.freeze([
  ['INCOMPLETE_STARTER_PROPOSALS', 'complete-starter-proposals'],
  ['FRANCHISE_IDENTITY_DIAGNOSTICS', 'resolve-franchise-identity'],
  ['LEAGUE_ELIGIBILITY_UNVERIFIED', 'verify-league-participation'],
  ['PLAYER_CONTRACT_INJURY_STATUS_UNVERIFIED', 'verify-player-contract-injury-status'],
  ['LINEUP_AUTHORIZATION_NOT_IMPLEMENTED', 'implement-lineup-authorization'],
  ['OFFICIAL_RESULT_COMMIT_NOT_IMPLEMENTED', 'implement-official-result-commit']
]);

function createRosterGameplayIntegrationPlan(state, homeTeamId, awayTeamId, seed = 1) {
  const review = assessRosterGamePreviewEligibility(state, homeTeamId, awayTeamId, seed);
  const blockers = new Set(review.blockers);
  const steps = REQUIREMENTS.filter(([code]) => blockers.has(code))
    .map(([blocker, action], index) => ({
      order: index + 1, blocker, action, resolved: false
    }));
  return {
    kind: 'phase10-roster-gameplay-integration-plan',
    version: 1,
    homeTeamId,
    awayTeamId,
    seed,
    previewAvailable: review.previewAvailable,
    calculatedResult: review.calculatedResult ? { ...review.calculatedResult } : null,
    missingSlots: {
      home: review.homeMissingSlots.slice(),
      away: review.awayMissingSlots.slice()
    },
    blockers: review.blockers.slice(),
    blockerCount: review.blockerCount,
    steps,
    nextAction: steps.length ? steps[0].action : null,
    validation: { ...review.validation },
    gameReady: false,
    resultOfficial: false,
    authorizationIssued: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterGameplayIntegrationPlan };
