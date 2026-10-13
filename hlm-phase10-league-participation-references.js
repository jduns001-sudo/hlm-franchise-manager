'use strict';

/**
 * Mission 734: read-only, explicit league participation reference assessment.
 * Missing or ambiguous membership never becomes gameplay authorization.
 */
const { createSimulationTeamRosterProjection } = require('./hlm-phase10-team-roster-projection');

function assessLeagueParticipationReferences(state, leagueId, homeTeamId, awayTeamId) {
  if (!Number.isSafeInteger(leagueId) || leagueId <= 0 ||
      !Number.isSafeInteger(homeTeamId) || homeTeamId <= 0 ||
      !Number.isSafeInteger(awayTeamId) || awayTeamId <= 0 || homeTeamId === awayTeamId) {
    const error = new TypeError('A positive league ID and distinct positive team IDs are required');
    error.code = 'INVALID_LEAGUE_PARTICIPATION_REFERENCES';
    throw error;
  }
  const projection = createSimulationTeamRosterProjection(state);
  const leagueRecords = state.universe.leagues.filter(league => league && league.id === leagueId);
  const knownTeams = new Set(projection.teams.map(team => team.teamId));
  const memberIds = leagueRecords.length === 1 && Array.isArray(leagueRecords[0].teamIds)
    ? leagueRecords[0].teamIds : null;
  const membershipValid = memberIds !== null &&
    memberIds.every(id => Number.isSafeInteger(id) && id > 0 && knownTeams.has(id)) &&
    new Set(memberIds).size === memberIds.length;
  const teams = [homeTeamId, awayTeamId].map(teamId => ({
    teamId,
    teamKnown: knownTeams.has(teamId),
    membership: !knownTeams.has(teamId) ? 'unknown-team'
      : !membershipValid ? 'unverified'
      : memberIds.includes(teamId) ? 'listed' : 'not-listed'
  }));
  const blockers = [];
  if (leagueRecords.length !== 1) blockers.push('LEAGUE_RECORD_NOT_UNIQUE');
  else if (!membershipValid) blockers.push('LEAGUE_MEMBERSHIP_UNVERIFIED');
  if (teams.some(team => !team.teamKnown)) blockers.push('UNKNOWN_PARTICIPATING_TEAM');
  if (membershipValid && teams.some(team => team.membership === 'not-listed')) {
    blockers.push('TEAM_NOT_LISTED_IN_LEAGUE');
  }
  return {
    kind: 'phase10-league-participation-reference-assessment',
    version: 1,
    leagueId,
    leagueRecordCount: leagueRecords.length,
    teams,
    listedTeamIds: membershipValid ? memberIds.slice() : [],
    referencesConsistent: blockers.length === 0,
    blockers,
    validation: { ...projection.validation },
    // A consistent membership list is evidence, not authorization to play.
    leagueEligibilityCertified: false,
    gameReady: false,
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessLeagueParticipationReferences };
