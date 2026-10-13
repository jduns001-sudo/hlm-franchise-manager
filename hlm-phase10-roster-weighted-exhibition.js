'use strict';
/** Deterministic roster-weighted exhibition result. Never an official game. */
const { createRosterBackedMatchupPreview } = require('./hlm-phase10-roster-matchup-preview');

function simulateRosterWeightedExhibition(state, homeTeamId, awayTeamId, seed = 1) {
  if (!Number.isSafeInteger(seed) || seed < 0) {
    const error = new TypeError('A nonnegative integer seed is required');
    error.code = 'INVALID_ROSTER_EXHIBITION_SEED';
    throw error;
  }
  const matchup = createRosterBackedMatchupPreview(state, homeTeamId, awayTeamId);
  const teams = [matchup.home, matchup.away];
  const blockers = teams.flatMap(team => [
    ...team.missingSlots.map(position => team.teamId + ':MISSING_' + position),
    ...team.slotEvidence.flatMap(slot => slot.blockers.map(reason => team.teamId + ':' + reason))
  ]);
  if (blockers.length) return {
    kind: 'phase10-roster-weighted-exhibition', version: 1,
    homeTeamId, awayTeamId, seed, playable: false, blockers,
    score: null, official: false, simulationAuthorized: false,
    sourceStateMutated: false, persistencePerformed: false
  };
  const average = team => team.proposedRatingSum / team.proposedRatingCount;
  let rng = (seed ^ Math.imul(homeTeamId, 2654435761) ^ Math.imul(awayTeamId, 1597334677)) >>> 0;
  const next = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  const homeStrength = average(matchup.home);
  const awayStrength = average(matchup.away);
  const delta = Math.max(-3, Math.min(3, (homeStrength - awayStrength) / 12));
  const homeRegulation = Math.max(0, Math.min(9, Math.round(2.8 + delta / 2 + (next() - 0.5) * 3)));
  const awayRegulation = Math.max(0, Math.min(9, Math.round(2.8 - delta / 2 + (next() - 0.5) * 3)));
  const overtime = homeRegulation === awayRegulation;
  const homeWinsOvertime = overtime && next() < Math.max(0.15, Math.min(0.85, 0.5 + delta / 10));
  const homeGoals = homeRegulation + (homeWinsOvertime ? 1 : 0);
  const awayGoals = awayRegulation + (overtime && !homeWinsOvertime ? 1 : 0);
  return {
    kind: 'phase10-roster-weighted-exhibition', version: 1,
    homeTeamId, awayTeamId, seed, playable: true, blockers: [],
    rosterRating: { home: homeStrength, away: awayStrength },
    score: { homeGoals, awayGoals, overtime,
      winnerTeamId: homeGoals > awayGoals ? homeTeamId : awayTeamId },
    official: false, simulationAuthorized: false,
    sourceStateMutated: false, persistencePerformed: false
  };
}
module.exports = { simulateRosterWeightedExhibition };
