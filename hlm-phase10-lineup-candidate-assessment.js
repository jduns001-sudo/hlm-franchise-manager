'use strict';

/**
 * Mission 721: deterministic, read-only lineup candidate assessment.
 * Conservative checks only; no game/lineup authorization or roster mutation.
 */
const { createSimulationTeamRosterProjection } = require('./hlm-phase10-team-roster-projection');

const POSITIONS = new Set(['C', 'LW', 'RW', 'D', 'G']);

function assessSimulationLineupCandidates(state) {
  const projection = createSimulationTeamRosterProjection(state);
  const teams = projection.teams.map(team => {
    const candidates = [];
    const excluded = [];
    for (const player of team.players) {
      const reasons = [];
      if (player.retired) reasons.push('RETIRED');
      if (!POSITIONS.has(player.position)) reasons.push('POSITION_UNKNOWN');
      if (!Number.isInteger(player.overall) || player.overall < 0 || player.overall > 99) {
        reasons.push('OVERALL_INVALID');
      }
      const item = { playerId: player.playerId, position: player.position,
        overall: player.overall, reasons };
      if (reasons.length) excluded.push(item);
      else candidates.push(item);
    }
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      candidates,
      excluded,
      candidateCount: candidates.length,
      excludedCount: excluded.length,
      // Lineup construction, league roster limits, injuries and contracts not yet resolved.
      lineupReady: null
    };
  });
  return {
    kind: 'phase10-lineup-candidate-assessment',
    version: 1,
    teams,
    unresolvedPlayers: projection.unresolvedPlayers.map(player => ({ ...player })),
    diagnostics: projection.diagnostics.map(diagnostic => ({ ...diagnostic })),
    validation: { ...projection.validation },
    lineupAuthorized: false,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { assessSimulationLineupCandidates };
