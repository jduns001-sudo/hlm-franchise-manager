'use strict';

/**
 * Mission 738: detached, roster-backed game simulation INPUT, not a game result.
 * No scoring, random numbers, eligibility certification or persistence.
 */
const { createRosterBackedMatchupPreview } = require('./hlm-phase10-roster-matchup-preview');

function createRosterBackedGameInput(state, homeTeamId, awayTeamId) {
  const matchup = createRosterBackedMatchupPreview(state, homeTeamId, awayTeamId);
  const toSide = side => {
    const blockers = side.slotEvidence.flatMap(slot =>
      slot.blockers.map(code => ({ position: slot.position, playerId: slot.playerId, code })));
    return {
      teamId: side.teamId,
      teamName: side.teamName,
      proposedPlayerIds: side.proposedPlayerIds.slice(),
      proposedRatingSum: side.proposedRatingSum,
      proposedRatingCount: side.proposedRatingCount,
      missingSlots: side.missingSlots.slice(),
      blockers,
      evidenceCompleteCount: side.evidenceCompleteCount,
      blockedOrUnverifiedCount: side.blockedOrUnverifiedCount,
      inputComplete: side.missingSlots.length === 0 &&
        side.proposedRatingCount === 6 && blockers.length === 0,
      gameEligible: null
    };
  };
  const home = toSide(matchup.home);
  const away = toSide(matchup.away);
  return {
    kind: 'phase10-roster-backed-game-input',
    version: 1,
    home,
    away,
    evidenceComplete: home.inputComplete && away.inputComplete,
    validation: { ...matchup.validation },
    // Even complete evidence is NOT legal eligibility or simulation approval.
    eligibilityCertified: false,
    simulationAuthorized: false,
    scoreCalculated: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createRosterBackedGameInput };
