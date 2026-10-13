'use strict';

/**
 * Mission 730: pure, deterministic regulation/overtime result rule calculator.
 * Inputs are independently supplied scores, not authorized game simulations.
 * No official result application, storage, or standings mutation.
 */
function calculateOfficialGameRules(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      !Number.isSafeInteger(input.homeTeamId) || input.homeTeamId <= 0 ||
      !Number.isSafeInteger(input.awayTeamId) || input.awayTeamId <= 0 ||
      input.homeTeamId === input.awayTeamId ||
      !Number.isSafeInteger(input.homeRegulationGoals) || input.homeRegulationGoals < 0 ||
      !Number.isSafeInteger(input.awayRegulationGoals) || input.awayRegulationGoals < 0) {
    const error = new TypeError('Distinct team IDs and nonnegative regulation scores are required');
    error.code = 'INVALID_OFFICIAL_GAME_RULE_INPUT';
    throw error;
  }
  const tied = input.homeRegulationGoals === input.awayRegulationGoals;
  const overtimeWinnerTeamId = input.overtimeWinnerTeamId;
  if (tied ? ![input.homeTeamId, input.awayTeamId].includes(overtimeWinnerTeamId)
    : overtimeWinnerTeamId !== undefined && overtimeWinnerTeamId !== null) {
    const error = new TypeError('A regulation tie requires exactly one valid overtime winner');
    error.code = 'INVALID_OFFICIAL_OVERTIME_WINNER';
    throw error;
  }
  const homeWins = tied
    ? overtimeWinnerTeamId === input.homeTeamId
    : input.homeRegulationGoals > input.awayRegulationGoals;
  const homeGoals = input.homeRegulationGoals + (tied && homeWins ? 1 : 0);
  const awayGoals = input.awayRegulationGoals + (tied && !homeWins ? 1 : 0);
  return {
    kind: 'phase10-official-game-rules-calculation',
    version: 1,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    homeGoals,
    awayGoals,
    overtime: tied,
    winnerTeamId: homeWins ? input.homeTeamId : input.awayTeamId,
    loserTeamId: homeWins ? input.awayTeamId : input.homeTeamId,
    homePoints: homeWins ? 2 : tied ? 1 : 0,
    awayPoints: homeWins ? (tied ? 1 : 0) : 2,
    // This is a pure rules calculation, not an official recorded game.
    resultOfficial: false,
    authorizationIssued: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { calculateOfficialGameRules };
