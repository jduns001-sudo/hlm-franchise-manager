'use strict';

/**
 * Mission 720: read-only team roster projection for Phase 10 integration.
 * Identity association only: not a lineup, roster eligibility or game authorization.
 */
const { createFranchiseSimulationSnapshot } = require('./hlm-franchise-simulation-data-bridge');

function createSimulationTeamRosterProjection(state) {
  const snapshot = createFranchiseSimulationSnapshot(state);
  const byId = new Map(snapshot.players.map(player => [player.id, player]));
  const teams = snapshot.teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    playerIds: team.playerIds.slice(),
    players: team.playerIds.map(id => {
      const player = byId.get(id);
      return {
        playerId: player.id,
        teamId: player.teamId,
        position: player.position,
        overall: player.overall,
        retired: player.retired
      };
    })
  }));
  return {
    kind: 'phase10-team-roster-projection',
    version: 1,
    teams,
    unresolvedPlayers: snapshot.players.filter(p => !p.teamResolved).map(p => ({
      playerId: p.id, teamId: p.teamId
    })),
    diagnostics: snapshot.diagnostics.map(d => ({ ...d })),
    validation: { ...snapshot.validation },
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createSimulationTeamRosterProjection };
