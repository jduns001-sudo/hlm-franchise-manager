'use strict';

/**
 * Mission 739: read-only roster preview evidence gate.
 * Never treats a projected score as an official game result.
 */
const { createRosterBackedMatchupPreview } = require('./hlm-phase10-roster-matchup-preview');
const { createRosterBackedGamePreview } = require('./hlm-phase10-roster-game-preview');

function createRosterGamePreviewGate(state, homeTeamId, awayTeamId, seed = 1) {
  const matchup = createRosterBackedMatchupPreview(state, homeTeamId, awayTeamId);
  const blockers = [];
  for (const [side, team] of [['home', matchup.home], ['away', matchup.away]]) {
    if (team.missingSlots.length) blockers.push({ side, code: 'MISSING_LINEUP_SLOTS', count: team.missingSlots.length });
    if (team.blockedOrUnverifiedCount) blockers.push({
      side, code: 'ELIGIBILITY_UNVERIFIED', count: team.blockedOrUnverifiedCount
    });
  }
  // The preview itself is advisory even when all contract/injury evidence is present.
  blockers.push({ side: 'both', code: 'OFFICIAL_ELIGIBILITY_NOT_CERTIFIED' });
  let projectedScore = null;
  if (!matchup.home.missingSlots.length && !matchup.away.missingSlots.length) {
    projectedScore = { ...createRosterBackedGamePreview(state, homeTeamId, awayTeamId, seed).projectedScore };
  }
  return {
    kind: 'phase10-roster-game-preview-gate',
    version: 1,
    homeTeamId,
    awayTeamId,
    projectedScore,
    blockers,
    previewAvailable: projectedScore !== null,
    resultOfficial: false,
    eligibilityCertified: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterGamePreviewGate };
