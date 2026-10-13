'use strict';

/**
 * Mission 727: read-only scheduled-season roster-backed outcome previews.
 * Never applies results, advances dates, computes official standings or persists.
 */
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { createRosterBackedGameOutcomeBatch } = require('./hlm-phase10-roster-game-outcome-batch');

function createSeasonRosterOutcomePreview(state, seed = 1) {
  const validation = validateGameStateEnvelope(state);
  if (!validation.valid) {
    const error = new TypeError('Valid GameState required for season preview');
    error.code = 'INVALID_SEASON_ROSTER_PREVIEW_STATE';
    throw error;
  }
  const scheduled = state.activity.games.filter(game => game && game.status === 'scheduled');
  const descriptors = scheduled.map(game => ({
    id: game.id, homeTeamId: game.homeTeamId, awayTeamId: game.awayTeamId
  }));
  const batch = createRosterBackedGameOutcomeBatch(state, descriptors, seed);
  return {
    kind: 'phase10-season-roster-outcome-preview',
    version: 1,
    scheduledGameCount: scheduled.length,
    proposedCount: batch.proposedCount,
    unavailableCount: batch.unavailableCount,
    games: batch.proposals.map((proposal, index) => ({
      ...proposal,
      date: scheduled[index].date ?? null,
      outcome: proposal.outcome ? {
        ...proposal.outcome,
        regulationScore: { ...proposal.outcome.regulationScore }
      } : null,
      homeMissingSlots: proposal.homeMissingSlots.slice(),
      awayMissingSlots: proposal.awayMissingSlots.slice()
    })),
    resultOfficial: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createSeasonRosterOutcomePreview };
