'use strict';

/**
 * Mission 736: join lineup proposals with contract/injury evidence for games.
 * A proposal is never authorization. Unknown or absent evidence stays unverified.
 */
const { createSimulationLineupProposals } = require('./hlm-phase10-lineup-proposals');
const { assessPlayerContractInjuryEvidence } = require('./hlm-phase10-contract-injury-evidence');

function createGameEligibilityEvidence(state) {
  const proposals = createSimulationLineupProposals(state);
  const evidence = assessPlayerContractInjuryEvidence(state);
  const byTeam = new Map(evidence.teams.map(team => [team.teamId,
    new Map(team.players.map(player => [player.playerId, player]))]));
  const teams = proposals.teams.map(team => {
    const playerEvidence = byTeam.get(team.teamId);
    const slots = [...team.skaterSlots, team.goalieSlot].map(slot => {
      if (slot.playerId === null) return {
        position: slot.position, playerId: null, status: 'missing',
        blockers: ['MISSING_POSITION']
      };
      const record = playerEvidence && playerEvidence.get(slot.playerId);
      const blockers = record ? record.blockers.slice() : ['MISSING_EVIDENCE'];
      if (record && record.contractEvidence !== 'active-team-contract') {
        blockers.push('CONTRACT_NOT_VERIFIED');
      }
      if (record && record.injuryEvidence !== 'no-active-injury-recorded') {
        blockers.push('INJURY_CLEARANCE_NOT_VERIFIED');
      }
      return {
        position: slot.position, playerId: slot.playerId,
        status: blockers.length ? 'blocked-or-unverified' : 'evidence-complete',
        contractEvidence: record ? record.contractEvidence : 'unverified',
        injuryEvidence: record ? record.injuryEvidence : 'unverified',
        blockers
      };
    });
    return {
      teamId: team.teamId,
      slots,
      missingSlots: team.missingSlots.slice(),
      evidenceCompleteCount: slots.filter(slot => slot.status === 'evidence-complete').length,
      blockedOrUnverifiedCount: slots.filter(slot => slot.status !== 'evidence-complete').length,
      // No proof of medical clearance, roster limits, cap or league rules.
      gameEligible: null
    };
  });
  return {
    kind: 'phase10-game-eligibility-evidence',
    version: 1,
    teams,
    validation: { ...proposals.validation },
    eligibilityCertified: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createGameEligibilityEvidence };
