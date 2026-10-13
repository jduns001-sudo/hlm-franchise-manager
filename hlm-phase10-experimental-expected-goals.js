'use strict';

/**
 * Mission 740: fixture-only experimental expected-goals model.
 * This is a deterministic research metric, not a game score, winner, or save action.
 */
const { createExperimentalRosterScorePreview } = require('./hlm-phase10-experimental-score-preview');

function createExperimentalExpectedGoalsModel(state, homeTeamId, awayTeamId) {
  const preview = createExperimentalRosterScorePreview(state, homeTeamId, awayTeamId);
  const ready = preview.evidenceComplete === true &&
    Number.isFinite(preview.homeMeanRating) && Number.isFinite(preview.awayMeanRating);
  // Bounded rating differential with fixed home advantage; no randomness.
  const differential = ready ? Math.max(-30, Math.min(30, preview.ratingDifference)) : null;
  const homeExpectedGoals = ready ? Math.round((2.5 + 0.2 + differential * 0.035) * 1000) / 1000 : null;
  const awayExpectedGoals = ready ? Math.round((2.5 - differential * 0.035) * 1000) / 1000 : null;
  return {
    kind: 'phase10-experimental-expected-goals-model',
    version: 1,
    homeTeamId: preview.homeTeamId,
    awayTeamId: preview.awayTeamId,
    evidenceComplete: ready,
    ratingDifference: preview.ratingDifference,
    homeExpectedGoals,
    awayExpectedGoals,
    homeBlockers: preview.homeBlockers.map(item => ({ ...item })),
    awayBlockers: preview.awayBlockers.map(item => ({ ...item })),
    homeMissingSlots: preview.homeMissingSlots.slice(),
    awayMissingSlots: preview.awayMissingSlots.slice(),
    // Expected goals are fractional research outputs, never actual final scores.
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    gameResultCreated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createExperimentalExpectedGoalsModel };
