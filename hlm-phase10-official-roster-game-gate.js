'use strict';

/**
 * Mission 728: read-only gate between illustrative season previews and official games.
 * A preview is never an authorized result. No scores, dates or saves are modified.
 */
const { createSeasonRosterOutcomePreview } = require('./hlm-phase10-season-roster-outcome-preview');

function assessOfficialRosterGameIntegration(state, seed = 1) {
  const preview = createSeasonRosterOutcomePreview(state, seed);
  const games = preview.games.map(game => {
    const blockers = [];
    if (!game.previewAvailable || !game.outcome) blockers.push('ROSTER_PREVIEW_UNAVAILABLE');
    if (game.outcome && game.outcome.tiedAtRegulation) {
      blockers.push('OFFICIAL_OVERTIME_RULE_NOT_IMPLEMENTED');
    }
    // Future official integration must explicitly validate rules, lineup, and results.
    blockers.push('OFFICIAL_GAME_RULES_NOT_AUTHORIZED');
    return {
      gameId: game.gameId,
      date: game.date,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      previewAvailable: game.previewAvailable,
      blockers,
      canApplyOfficialResult: false
    };
  });
  return {
    kind: 'phase10-official-roster-game-integration-gate',
    version: 1,
    scheduledGameCount: preview.scheduledGameCount,
    previewAvailableCount: preview.proposedCount,
    blockedGameCount: games.length,
    games,
    officialResultCount: 0,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessOfficialRosterGameIntegration };
