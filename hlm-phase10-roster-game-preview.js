'use strict';

/**
 * Mission 723: read-only, deterministic roster-backed game preview.
 * This is not the authorized game simulation engine or a saved result.
 */
const { createSimulationLineupProposals } = require('./hlm-phase10-lineup-proposals');

function hashSeed(seed, homeTeamId, awayTeamId) {
  if (!Number.isSafeInteger(seed) || seed < 0) {
    const error = new TypeError('A nonnegative integer seed is required');
    error.code = 'INVALID_ROSTER_GAME_PREVIEW_SEED';
    throw error;
  }
  let value = (seed ^ Math.imul(homeTeamId, 2654435761) ^ Math.imul(awayTeamId, 1597334677)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 2246822507) >>> 0;
  value ^= value >>> 13;
  return value >>> 0;
}

function createRosterBackedGamePreview(state, homeTeamId, awayTeamId, seed = 1) {
  if (!Number.isSafeInteger(homeTeamId) || homeTeamId <= 0 ||
      !Number.isSafeInteger(awayTeamId) || awayTeamId <= 0 ||
      homeTeamId === awayTeamId) {
    const error = new TypeError('Distinct positive permanent team IDs are required');
    error.code = 'INVALID_ROSTER_GAME_PREVIEW_TEAMS';
    throw error;
  }
  const proposals = createSimulationLineupProposals(state);
  const home = proposals.teams.find(t => t.teamId === homeTeamId);
  const away = proposals.teams.find(t => t.teamId === awayTeamId);
  if (!home || !away || !home.proposalComplete || !away.proposalComplete) {
    const error = new Error('Both teams require complete six-slot lineup proposals');
    error.code = 'INCOMPLETE_ROSTER_GAME_PREVIEW_LINEUP';
    throw error;
  }
  const rating = team => {
    const skaters = team.skaterSlots.reduce((sum, slot) => sum + slot.overall, 0) / team.skaterSlots.length;
    return { skaters, goalie: team.goalieSlot.overall };
  };
  const homeRating = rating(home);
  const awayRating = rating(away);
  const random = hashSeed(seed, homeTeamId, awayTeamId);
  // Deliberately bounded preview only: no season advancement or box scores.
  const homeAttack = homeRating.skaters - awayRating.goalie;
  const awayAttack = awayRating.skaters - homeRating.goalie;
  const homeGoals = Math.max(0, Math.min(9, 3 + Math.round(homeAttack / 15) + (random % 3) - 1));
  const awayGoals = Math.max(0, Math.min(9, 3 + Math.round(awayAttack / 15) + (Math.floor(random / 3) % 3) - 1));
  return {
    kind: 'phase10-roster-backed-game-preview',
    version: 1,
    homeTeamId,
    awayTeamId,
    seed,
    home: { teamId: homeTeamId, rating: homeRating, playerIds: [
      ...home.skaterSlots.map(s => s.playerId), home.goalieSlot.playerId
    ] },
    away: { teamId: awayTeamId, rating: awayRating, playerIds: [
      ...away.skaterSlots.map(s => s.playerId), away.goalieSlot.playerId
    ] },
    projectedScore: { homeGoals, awayGoals },
    // A tied preview is possible; no OT/winner logic is asserted.
    resultOfficial: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterBackedGamePreview };
