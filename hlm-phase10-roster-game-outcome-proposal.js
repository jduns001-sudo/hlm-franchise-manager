'use strict';

/**
 * Mission 725: read-only illustrative game outcome from roster readiness.
 * Resolves tied previews deterministically without creating an official result.
 */
const { assessRosterBackedGameReadiness } = require('./hlm-phase10-roster-game-readiness');

function createRosterBackedGameOutcomeProposal(state, homeTeamId, awayTeamId, seed = 1) {
  const readiness = assessRosterBackedGameReadiness(state, homeTeamId, awayTeamId, seed);
  let outcome = null;
  if (readiness.previewAvailable) {
    const { homeGoals, awayGoals } = readiness.preview.projectedScore;
    const tied = homeGoals === awayGoals;
    // Stable tie-break is illustrative only, not a league overtime rule.
    const homeWinsTie = ((seed + homeTeamId + awayTeamId) % 2) === 0;
    const winnerTeamId = tied ? (homeWinsTie ? homeTeamId : awayTeamId) :
      (homeGoals > awayGoals ? homeTeamId : awayTeamId);
    outcome = {
      homeTeamId,
      awayTeamId,
      regulationScore: { homeGoals, awayGoals },
      tiedAtRegulation: tied,
      winnerTeamId,
      loserTeamId: winnerTeamId === homeTeamId ? awayTeamId : homeTeamId,
      resolution: tied ? 'ILLUSTRATIVE_TIE_BREAK' : 'REGULATION_PREVIEW',
      resultOfficial: false
    };
  }
  return {
    kind: 'phase10-roster-game-outcome-proposal',
    version: 1,
    homeTeamId,
    awayTeamId,
    seed,
    previewAvailable: readiness.previewAvailable,
    homeMissingSlots: readiness.homeMissingSlots.slice(),
    awayMissingSlots: readiness.awayMissingSlots.slice(),
    outcome,
    validation: { ...readiness.validation },
    gameReady: null,
    resultOfficial: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterBackedGameOutcomeProposal };
