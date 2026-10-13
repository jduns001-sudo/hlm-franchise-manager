'use strict';

/**
 * Mission 735: read-only contract/injury evidence for roster candidates.
 * Unknown statuses remain unverified. No eligibility or game authorization.
 */
const { assessSimulationLineupCandidates } = require('./hlm-phase10-lineup-candidate-assessment');

function assessPlayerContractInjuryEvidence(state) {
  const lineup = assessSimulationLineupCandidates(state);
  const contracts = state.assets.contracts;
  const injuries = state.activity.injuries;
  const teams = lineup.teams.map(team => ({
    teamId: team.teamId,
    players: [...team.candidates, ...team.excluded].map(player => {
      const matches = contracts.filter(c => c && c.playerId === player.playerId);
      const active = matches.filter(c => c.status === 'Active' || c.status === 'Signed');
      const conflicting = active.length > 1 || (active.length === 1 && active[0].teamId !== team.teamId);
      const contractEvidence = conflicting ? 'conflicting'
        : active.length === 1 ? 'active-team-contract' : 'unverified';
      const injuryMatches = injuries.filter(i => i && i.playerId === player.playerId);
      const activeInjuries = injuryMatches.filter(i => i.status === 'Active');
      const injuryEvidence = activeInjuries.length ? 'active-injury'
        : injuryMatches.some(i => !['Active', 'Recovered'].includes(i.status)) ? 'unverified'
        : injuryMatches.length ? 'no-active-injury-recorded' : 'unverified';
      const blockers = [];
      if (player.reasons.length) blockers.push('BASELINE_CANDIDATE_EXCLUDED');
      if (conflicting) blockers.push('CONTRACT_CONFLICT');
      if (activeInjuries.length) blockers.push('ACTIVE_INJURY');
      return {
        playerId: player.playerId,
        contractEvidence,
        injuryEvidence,
        contractRecordCount: matches.length,
        injuryRecordCount: injuryMatches.length,
        blockers
      };
    })
  }));
  return {
    kind: 'phase10-contract-injury-evidence',
    version: 1,
    teams,
    validation: { ...lineup.validation },
    // No proof of contract or absence of an injury is inferred from missing data.
    eligibilityCertified: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessPlayerContractInjuryEvidence };
