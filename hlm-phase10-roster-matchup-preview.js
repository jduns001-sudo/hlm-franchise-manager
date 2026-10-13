'use strict';

/**
 * Mission 737: read-only roster-backed game matchup preview.
 * Never computes a score or authorizes simulation from eligibility evidence.
 */
const { createSimulationLineupProposals } = require('./hlm-phase10-lineup-proposals');
const { createGameEligibilityEvidence } = require('./hlm-phase10-game-eligibility-evidence');

function createRosterBackedMatchupPreview(state, homeTeamId, awayTeamId) {
  if (!Number.isSafeInteger(homeTeamId) || homeTeamId <= 0 ||
      !Number.isSafeInteger(awayTeamId) || awayTeamId <= 0 || homeTeamId === awayTeamId) {
    const error = new TypeError('Two distinct positive team IDs are required');
    error.code = 'INVALID_PHASE10_MATCHUP_TEAM_IDS';
    throw error;
  }
  const proposals = createSimulationLineupProposals(state);
  const evidence = createGameEligibilityEvidence(state);
  const summarize = teamId => {
    const team = proposals.teams.find(item => item.teamId === teamId);
    const proof = evidence.teams.find(item => item.teamId === teamId);
    if (!team || !proof) {
      const error = new Error('Matchup team ID is not in the canonical franchise teams');
      error.code = 'UNKNOWN_PHASE10_MATCHUP_TEAM_ID';
      throw error;
    }
    const selected = [...team.skaterSlots, team.goalieSlot];
    const ratings = selected.filter(slot => slot.playerId !== null && Number.isInteger(slot.overall))
      .map(slot => slot.overall);
    return {
      teamId,
      teamName: team.teamName,
      proposedPlayerIds: selected.filter(slot => slot.playerId !== null).map(slot => slot.playerId),
      missingSlots: team.missingSlots.slice(),
      proposedRatingSum: ratings.reduce((sum, value) => sum + value, 0),
      proposedRatingCount: ratings.length,
      evidenceCompleteCount: proof.evidenceCompleteCount,
      blockedOrUnverifiedCount: proof.blockedOrUnverifiedCount,
      slotEvidence: proof.slots.map(slot => ({
        position: slot.position, playerId: slot.playerId, status: slot.status,
        blockers: slot.blockers.slice()
      })),
      gameEligible: null
    };
  };
  return {
    kind: 'phase10-roster-backed-matchup-preview',
    version: 1,
    home: summarize(homeTeamId),
    away: summarize(awayTeamId),
    validation: { ...evidence.validation },
    scorePredicted: false,
    eligibilityCertified: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterBackedMatchupPreview };
