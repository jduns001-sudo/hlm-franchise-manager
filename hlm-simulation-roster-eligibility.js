'use strict';

/**
 * Mission 666: conservative, read-only roster eligibility assessment.
 * Team association is not proof of active-roster, lineup, or game eligibility.
 */
function assessSimulationRosterEligibility(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.players) || !Array.isArray(snapshot.teams)) {
    const error = new Error('A classified canonical franchise bridge snapshot is required');
    error.code = 'INVALID_ROSTER_ELIGIBILITY_INPUT';
    throw error;
  }
  const teams = snapshot.teams.map(team => ({
    teamId: team.id,
    associatedPlayerIds: [],
    candidatePlayerIds: [],
    excludedPlayerIds: [],
    undeterminedPlayerIds: []
  }));
  const teamById = new Map(teams.map(team => [team.teamId, team]));
  const players = [];
  const counts = { candidate: 0, excluded: 0, undetermined: 0 };
  for (const player of snapshot.players) {
    const reference = player && player.organizationReference;
    if (!reference || typeof reference.status !== 'string') {
      const error = new Error('Each player must have a classified organization reference');
      error.code = 'MISSING_PLAYER_ORGANIZATION_CLASSIFICATION';
      throw error;
    }
    const reasons = [];
    const knownTeam = reference.status === 'known-team' &&
      player.teamResolved === true && teamById.has(player.teamId) &&
      reference.teamId === player.teamId;
    let assessment;
    if (player.retired === true) {
      assessment = 'excluded';
      reasons.push('RETIRED_PLAYER');
    } else if (!knownTeam) {
      assessment = 'undetermined';
      reasons.push('TEAM_ASSIGNMENT_NOT_CONFIRMED');
    } else {
      assessment = 'candidate';
      reasons.push('KNOWN_TEAM_ASSOCIATION_ONLY');
    }
    // These are deliberately not inferred from the identity bridge.
    reasons.push('GAME_ELIGIBILITY_NOT_ESTABLISHED');
    const row = {
      playerId: player.id,
      teamId: player.teamId,
      organizationStatus: reference.status,
      retired: player.retired === true,
      assessment,
      reasons,
      gameEligible: null,
      lineupEligible: null
    };
    players.push(row);
    counts[assessment] += 1;
    if (knownTeam) {
      const team = teamById.get(player.teamId);
      team.associatedPlayerIds.push(player.id);
      team[assessment === 'candidate' ? 'candidatePlayerIds' : assessment === 'excluded' ? 'excludedPlayerIds' : 'undeterminedPlayerIds'].push(player.id);
    }
  }
  return {
    kind: 'simulation-roster-eligibility-assessment',
    version: 1,
    players,
    teams,
    counts,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessSimulationRosterEligibility };
