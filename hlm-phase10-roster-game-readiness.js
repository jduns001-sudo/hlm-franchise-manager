'use strict';

/**
 * Mission 724: read-only roster-backed game readiness gate.
 * Does not authorize or execute official simulation.
 */
const { createSimulationLineupProposals } = require('./hlm-phase10-lineup-proposals');
const { createRosterBackedGamePreview } = require('./hlm-phase10-roster-game-preview');

function assessRosterBackedGameReadiness(state, homeTeamId, awayTeamId, seed = 1) {
  if (!Number.isSafeInteger(homeTeamId) || homeTeamId <= 0 ||
      !Number.isSafeInteger(awayTeamId) || awayTeamId <= 0 ||
      homeTeamId === awayTeamId) {
    const error = new TypeError('Distinct positive team IDs required');
    error.code = 'INVALID_ROSTER_GAME_READINESS_TEAMS';
    throw error;
  }
  if (!Number.isSafeInteger(seed) || seed < 0) {
    const error = new TypeError('Nonnegative safe integer seed required');
    error.code = 'INVALID_ROSTER_GAME_READINESS_SEED';
    throw error;
  }
  const proposals = createSimulationLineupProposals(state);
  const home = proposals.teams.find(team => team.teamId === homeTeamId);
  const away = proposals.teams.find(team => team.teamId === awayTeamId);
  const missing = team => team ? team.missingSlots.slice() : ['TEAM_NOT_FOUND'];
  const homeMissing = missing(home);
  const awayMissing = missing(away);
  const complete = !!home && !!away && home.proposalComplete && away.proposalComplete;
  const preview = complete ? createRosterBackedGamePreview(state, homeTeamId, awayTeamId, seed) : null;
  return {
    kind: 'phase10-roster-game-readiness',
    version: 1,
    homeTeamId,
    awayTeamId,
    seed,
    previewAvailable: complete,
    homeMissingSlots: homeMissing,
    awayMissingSlots: awayMissing,
    preview,
    validation: { ...proposals.validation },
    // Complete illustrative proposals do not establish legal rosters, official
    // game authorization, injuries, contracts, or result persistence.
    gameReady: null,
    resultOfficial: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessRosterBackedGameReadiness };
