'use strict';

/**
 * Mission 662: read-only franchise-to-simulation identity bridge.
 * No persistence, roster eligibility decisions, score calculation, or UI wiring.
 */
const { validateGameStateEnvelope } = require('./hlm-game-state');

function permanentId(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function createFranchiseSimulationSnapshot(state) {
  const envelope = validateGameStateEnvelope(state);
  if (!envelope.valid) {
    const error = new Error('A valid GameState envelope is required');
    error.code = 'INVALID_FRANCHISE_BRIDGE_STATE';
    error.details = envelope.errors;
    throw error;
  }

  const diagnostics = [];
  const teamIds = new Set();
  const playerIds = new Set();
  const teams = [];
  const players = [];
  const playerIdsByTeam = new Map();

  for (const [index, team] of state.universe.teams.entries()) {
    const id = permanentId(team && team.id);
    if (id === null) {
      diagnostics.push({ code: 'INVALID_TEAM_ID', index, value: team && team.id });
      continue;
    }
    if (teamIds.has(id)) {
      diagnostics.push({ code: 'DUPLICATE_TEAM_ID', index, teamId: id });
      continue;
    }
    teamIds.add(id);
    teams.push({ id, name: typeof team.name === 'string' ? team.name : null });
    playerIdsByTeam.set(id, []);
  }

  for (const [index, player] of state.universe.players.entries()) {
    const id = permanentId(player && player.id);
    if (id === null) {
      diagnostics.push({ code: 'INVALID_PLAYER_ID', index, value: player && player.id });
      continue;
    }
    if (playerIds.has(id)) {
      diagnostics.push({ code: 'DUPLICATE_PLAYER_ID', index, playerId: id });
      continue;
    }
    playerIds.add(id);

    // Preserve unresolved/sentinel assignments exactly. Never infer free agency.
    const teamId = player.teamId === undefined ? null : player.teamId;
    const teamResolved = permanentId(teamId) !== null && teamIds.has(teamId);
    if (!teamResolved) {
      diagnostics.push({ code: 'UNRESOLVED_PLAYER_TEAM_REFERENCE', playerId: id, teamId });
    } else {
      playerIdsByTeam.get(teamId).push(id);
    }
    players.push({
      id,
      teamId,
      teamResolved,
      retired: player.retired === true,
      position: player.position ?? null,
      overall: player.ovr ?? null
    });
  }

  const teamSnapshots = teams.map(team => ({
    ...team,
    playerIds: playerIdsByTeam.get(team.id).slice()
  }));
  return {
    kind: 'franchise-simulation-data-snapshot',
    version: 1,
    teams: teamSnapshots,
    players,
    diagnostics,
    validation: { valid: diagnostics.length === 0, issueCount: diagnostics.length },
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createFranchiseSimulationSnapshot };
