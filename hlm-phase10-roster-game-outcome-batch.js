'use strict';

/**
 * Mission 726: detached, deterministic roster-backed outcome proposals for a
 * scheduled batch. Never applies scores or advances a franchise.
 */
const { createRosterBackedGameOutcomeProposal } = require('./hlm-phase10-roster-game-outcome-proposal');

function createRosterBackedGameOutcomeBatch(state, games, seed = 1) {
  if (!Array.isArray(games)) {
    const error = new TypeError('An array of scheduled game descriptors is required');
    error.code = 'INVALID_ROSTER_GAME_BATCH';
    throw error;
  }
  if (!Number.isSafeInteger(seed) || seed < 0) {
    const error = new TypeError('A nonnegative safe integer seed is required');
    error.code = 'INVALID_ROSTER_GAME_BATCH_SEED';
    throw error;
  }
  const seen = new Set();
  const proposals = games.map((game, index) => {
    if (!game || typeof game !== 'object' || Array.isArray(game) ||
        (typeof game.id !== 'string' && !Number.isSafeInteger(game.id)) ||
        String(game.id).length === 0 || seen.has(String(game.id)) ||
        !Number.isSafeInteger(game.homeTeamId) || game.homeTeamId <= 0 ||
        !Number.isSafeInteger(game.awayTeamId) || game.awayTeamId <= 0 ||
        game.homeTeamId === game.awayTeamId) {
      const error = new TypeError('Distinct game IDs and valid opposing team IDs required');
      error.code = 'INVALID_ROSTER_GAME_BATCH_ENTRY';
      throw error;
    }
    if (!Number.isSafeInteger(seed + index)) {
      const error = new RangeError('Batch seed plus game index exceeds safe integer range');
      error.code = 'INVALID_ROSTER_GAME_BATCH_SEED';
      throw error;
    }
    seen.add(String(game.id));
    const proposal = createRosterBackedGameOutcomeProposal(
      state, game.homeTeamId, game.awayTeamId, seed + index
    );
    return {
      gameId: game.id,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      seed: seed + index,
      previewAvailable: proposal.previewAvailable,
      outcome: proposal.outcome ? {
        ...proposal.outcome,
        regulationScore: { ...proposal.outcome.regulationScore }
      } : null,
      homeMissingSlots: proposal.homeMissingSlots.slice(),
      awayMissingSlots: proposal.awayMissingSlots.slice(),
      resultOfficial: false
    };
  });
  return {
    kind: 'phase10-roster-game-outcome-batch',
    version: 1,
    gameCount: proposals.length,
    proposedCount: proposals.filter(p => p.outcome !== null).length,
    unavailableCount: proposals.filter(p => p.outcome === null).length,
    proposals,
    resultOfficial: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterBackedGameOutcomeBatch };
