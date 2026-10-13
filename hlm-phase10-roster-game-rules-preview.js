'use strict';

/**
 * Mission 731: compose a roster-backed illustrative outcome with pure game rules.
 * Read-only preview; never authorize or record an official game.
 */
const { createRosterBackedGameOutcomeProposal } = require('./hlm-phase10-roster-game-outcome-proposal');
const { calculateOfficialGameRules } = require('./hlm-phase10-official-game-rules-calculator');

function createRosterGameRulesPreview(state, homeTeamId, awayTeamId, seed = 1) {
  const proposal = createRosterBackedGameOutcomeProposal(state, homeTeamId, awayTeamId, seed);
  let calculation = null;
  if (proposal.outcome) {
    const regulation = proposal.outcome.regulationScore;
    calculation = calculateOfficialGameRules({
      homeTeamId,
      awayTeamId,
      homeRegulationGoals: regulation.homeGoals,
      awayRegulationGoals: regulation.awayGoals,
      overtimeWinnerTeamId: proposal.outcome.tiedAtRegulation
        ? proposal.outcome.winnerTeamId : undefined
    });
  }
  return {
    kind: 'phase10-roster-game-rules-preview',
    version: 1,
    homeTeamId,
    awayTeamId,
    seed,
    previewAvailable: proposal.previewAvailable,
    homeMissingSlots: proposal.homeMissingSlots.slice(),
    awayMissingSlots: proposal.awayMissingSlots.slice(),
    regulationScore: proposal.outcome ? { ...proposal.outcome.regulationScore } : null,
    calculatedResult: calculation ? {
      homeGoals: calculation.homeGoals,
      awayGoals: calculation.awayGoals,
      overtime: calculation.overtime,
      winnerTeamId: calculation.winnerTeamId,
      loserTeamId: calculation.loserTeamId,
      homePoints: calculation.homePoints,
      awayPoints: calculation.awayPoints
    } : null,
    validation: { ...proposal.validation },
    gameReady: null,
    resultOfficial: false,
    authorizationIssued: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterGameRulesPreview };
