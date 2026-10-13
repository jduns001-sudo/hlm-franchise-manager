'use strict';

/** Mission 739: pure, experimental rating comparison, never an authorized game. */
const { createRosterBackedGameInput } = require('./hlm-phase10-roster-game-input');

function createExperimentalRosterScorePreview(state, homeTeamId, awayTeamId) {
  const input = createRosterBackedGameInput(state, homeTeamId, awayTeamId);
  const ready = input.evidenceComplete === true &&
    input.home.proposedRatingCount === 6 && input.away.proposedRatingCount === 6;
  const homeMean = ready ? input.home.proposedRatingSum / 6 : null;
  const awayMean = ready ? input.away.proposedRatingSum / 6 : null;
  const ratingDifference = ready ? homeMean - awayMean : null;
  return {
    kind: 'phase10-experimental-roster-score-preview',
    version: 1,
    homeTeamId: input.home.teamId,
    awayTeamId: input.away.teamId,
    evidenceComplete: ready,
    homeMeanRating: homeMean,
    awayMeanRating: awayMean,
    ratingDifference,
    favoredTeamId: !ready || ratingDifference === 0 ? null :
      ratingDifference > 0 ? input.home.teamId : input.away.teamId,
    homeBlockers: input.home.blockers.map(b => ({ ...b })),
    awayBlockers: input.away.blockers.map(b => ({ ...b })),
    homeMissingSlots: input.home.missingSlots.slice(),
    awayMissingSlots: input.away.missingSlots.slice(),
    // This is a comparative metric, not a score or win probability.
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = { createExperimentalRosterScorePreview };
