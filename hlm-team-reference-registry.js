'use strict';

/**
 * Phase 1 Mission 6: read-only Team/reference registry.
 * Known Team records remain authoritative. Unknown positive IDs and sentinel
 * values are preserved as unresolved references, never invented as Teams.
 */

const safeInt = value => Number.isSafeInteger(Number(value)) ? Number(value) : null;

function buildTeamReferenceRegistry(universe) {
  const teams = Array.isArray(universe && universe.teams) ? universe.teams : [];
  const players = Array.isArray(universe && universe.players) ? universe.players : [];
  const draftPicks = Array.isArray(universe && universe.draftPicks) ? universe.draftPicks : [];
  const teamsById = new Map();
  const diagnostics = {
    invalidTeamIds: [],
    duplicateTeamIds: [],
    unresolvedPositiveReferences: new Map(),
    sentinelReferences: new Map()
  };

  teams.forEach((team, sourceIndex) => {
    const id = safeInt(team && team.id);
    if (id === null || id <= 0) {
      diagnostics.invalidTeamIds.push({ sourceIndex, value: team && team.id });
      return;
    }
    if (teamsById.has(id)) {
      diagnostics.duplicateTeamIds.push({ teamId: id, sourceIndex });
      return;
    }
    teamsById.set(id, { teamId: id, canonical: team, sourceIndex });
  });

  function recordReference(rawId, source) {
    const id = safeInt(rawId);
    if (id === null) return;
    if (teamsById.has(id)) return;

    const target = id > 0 ? diagnostics.unresolvedPositiveReferences : diagnostics.sentinelReferences;
    const existing = target.get(id) || { teamId: id, count: 0, sources: {} };
    existing.count += 1;
    existing.sources[source] = (existing.sources[source] || 0) + 1;
    target.set(id, existing);
  }

  players.forEach(player => recordReference(player && player.teamId, 'player.teamId'));
  draftPicks.forEach(pick => {
    recordReference(pick && pick.originalTeamId, 'draftPick.originalTeamId');
    recordReference(pick && pick.ownerTeamId, 'draftPick.ownerTeamId');
    recordReference(pick && pick.currentOwnerTeamId, 'draftPick.currentOwnerTeamId');
  });

  return { teamsById, diagnostics };
}

function resolveTeamReference(registry, rawId) {
  const id = safeInt(rawId);
  if (id === null) return { status: 'invalid', teamId: rawId };
  if (registry.teamsById.has(id)) {
    return { status: 'known-team', teamId: id, record: registry.teamsById.get(id) };
  }
  if (id <= 0) return { status: 'sentinel', teamId: id };
  return { status: 'unresolved-positive', teamId: id };
}

function teamReferenceSummary(registry) {
  return {
    knownTeams: registry.teamsById.size,
    invalidTeamIds: registry.diagnostics.invalidTeamIds.length,
    duplicateTeamIds: registry.diagnostics.duplicateTeamIds.length,
    unresolvedPositiveIds: registry.diagnostics.unresolvedPositiveReferences.size,
    sentinelIds: registry.diagnostics.sentinelReferences.size
  };
}

module.exports = { buildTeamReferenceRegistry, resolveTeamReference, teamReferenceSummary };
