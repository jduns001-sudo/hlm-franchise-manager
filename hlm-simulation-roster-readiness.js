'use strict';

/**
 * Mission 667: descriptive roster readiness diagnostics, not game eligibility.
 * No assumed roster size, league rules, positions, or lineup decisions.
 */
function createSimulationRosterReadinessReport(assessment) {
  if (!assessment || assessment.kind !== 'simulation-roster-eligibility-assessment' ||
      !Array.isArray(assessment.players) || !Array.isArray(assessment.teams)) {
    const error = new Error('A Mission 666 roster eligibility assessment is required');
    error.code = 'INVALID_ROSTER_READINESS_INPUT';
    throw error;
  }

  const teams = assessment.teams.map(team => {
    const candidatePlayerIds = Array.isArray(team.candidatePlayerIds) ? team.candidatePlayerIds.slice() : [];
    const excludedPlayerIds = Array.isArray(team.excludedPlayerIds) ? team.excludedPlayerIds.slice() : [];
    const undeterminedPlayerIds = Array.isArray(team.undeterminedPlayerIds) ? team.undeterminedPlayerIds.slice() : [];
    const associatedPlayerIds = Array.isArray(team.associatedPlayerIds) ? team.associatedPlayerIds.slice() : [];
    const issues = [];
    if (candidatePlayerIds.length === 0) issues.push('NO_CONFIRMED_TEAM_CANDIDATES');
    if (excludedPlayerIds.length) issues.push('RETIRED_ASSOCIATED_PLAYERS');
    if (undeterminedPlayerIds.length) issues.push('UNDETERMINED_ASSOCIATED_PLAYERS');
    issues.push('GAME_ELIGIBILITY_NOT_ESTABLISHED');
    issues.push('ROSTER_REQUIREMENTS_NOT_DEFINED');
    return {
      teamId: team.teamId,
      associatedCount: associatedPlayerIds.length,
      candidateCount: candidatePlayerIds.length,
      excludedCount: excludedPlayerIds.length,
      undeterminedAssociatedCount: undeterminedPlayerIds.length,
      candidatePlayerIds,
      excludedPlayerIds,
      undeterminedPlayerIds,
      issues,
      rosterSufficiency: 'unknown',
      gameReady: null
    };
  });

  const unresolvedByStatus = {};
  const unresolvedPlayers = [];
  for (const player of assessment.players) {
    if (player.assessment === 'undetermined') {
      const status = player.organizationStatus || 'missing-classification';
      unresolvedByStatus[status] = (unresolvedByStatus[status] || 0) + 1;
      unresolvedPlayers.push({
        playerId: player.playerId,
        teamId: player.teamId,
        organizationStatus: status
      });
    }
  }

  return {
    kind: 'simulation-roster-readiness-report',
    version: 1,
    teams,
    unresolvedPlayers,
    unresolvedByStatus,
    summary: {
      teamCount: teams.length,
      teamsWithCandidates: teams.filter(t => t.candidateCount > 0).length,
      teamsWithoutCandidates: teams.filter(t => t.candidateCount === 0).length,
      candidateCount: teams.reduce((n, t) => n + t.candidateCount, 0),
      unresolvedPlayerCount: unresolvedPlayers.length
    },
    thresholdsApplied: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createSimulationRosterReadinessReport };
