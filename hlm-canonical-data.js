'use strict';

/**
 * Phase 1 Mission 3: read-only canonical Player registry prototype.
 *
 * This module does not mutate source JSON, browser state, or app runtime.
 * Universe Player ID is the canonical identity. Roster rows are retained as
 * source snapshots grouped by that permanent ID. Conflicts are reported, not
 * silently repaired.
 */

const num = value => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const positiveSafeInt = value => {
  const n = num(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

function indexRosterSnapshots(rosterRows = []) {
  const byPlayerId = new Map();
  const invalidRows = [];

  rosterRows.forEach((row, sourceIndex) => {
    const playerId = positiveSafeInt(row && row.id);
    const snapshot = { sourceIndex, row };
    if (playerId === null) {
      invalidRows.push(snapshot);
      return;
    }
    if (!byPlayerId.has(playerId)) byPlayerId.set(playerId, []);
    byPlayerId.get(playerId).push(snapshot);
  });

  return { byPlayerId, invalidRows };
}

function distinctValues(snapshots, field) {
  const values = snapshots
    .map(s => s.row && s.row[field])
    .filter(v => v !== undefined && v !== null && v !== '');
  return [...new Set(values.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)))];
}

function rosterConflicts(snapshots) {
  const fields = ['ovr', 'potential', 'teamId', 'pos', 'position', 'type', 'aav', 'yl'];
  const conflicts = {};
  fields.forEach(field => {
    const values = distinctValues(snapshots, field);
    if (values.length > 1) conflicts[field] = values;
  });
  return conflicts;
}

function buildCanonicalPlayerRegistry(universe, roster) {
  const universePlayers = Array.isArray(universe && universe.players) ? universe.players : [];
  const rosterRows = Array.isArray(roster && roster.players) ? roster.players : [];
  const { byPlayerId: rosterById, invalidRows } = indexRosterSnapshots(rosterRows);

  const playersById = new Map();
  const duplicateUniverseIds = [];
  const invalidUniversePlayers = [];

  universePlayers.forEach((player, sourceIndex) => {
    const playerId = positiveSafeInt(player && player.id);
    if (playerId === null) {
      invalidUniversePlayers.push({ sourceIndex, player });
      return;
    }
    if (playersById.has(playerId)) {
      duplicateUniverseIds.push(playerId);
      return;
    }

    const snapshots = rosterById.get(playerId) || [];
    playersById.set(playerId, {
      playerId,
      canonical: player,
      sources: {
        universe: { sourceIndex, player },
        rosterSnapshots: snapshots
      },
      conflicts: rosterConflicts(snapshots)
    });
  });

  const rosterIdsMissingUniverse = [...rosterById.keys()].filter(id => !playersById.has(id));

  const duplicateRosterIds = [...rosterById.entries()]
    .filter(([, snapshots]) => snapshots.length > 1)
    .map(([playerId, snapshots]) => ({
      playerId,
      snapshotCount: snapshots.length,
      conflicts: rosterConflicts(snapshots)
    }));

  return {
    playersById,
    diagnostics: {
      universePlayerRows: universePlayers.length,
      canonicalPlayers: playersById.size,
      rosterRows: rosterRows.length,
      rosterDistinctPlayerIds: rosterById.size,
      invalidUniversePlayers,
      duplicateUniverseIds: [...new Set(duplicateUniverseIds)],
      invalidRosterRows: invalidRows,
      rosterIdsMissingUniverse,
      duplicateRosterIds,
      duplicateRosterPlayersWithConflicts: duplicateRosterIds.filter(x => Object.keys(x.conflicts).length > 0).length
    }
  };
}

function registrySummary(registry) {
  const d = registry.diagnostics;
  return {
    universePlayerRows: d.universePlayerRows,
    canonicalPlayers: d.canonicalPlayers,
    rosterRows: d.rosterRows,
    rosterDistinctPlayerIds: d.rosterDistinctPlayerIds,
    invalidUniversePlayers: d.invalidUniversePlayers.length,
    duplicateUniverseIds: d.duplicateUniverseIds.length,
    invalidRosterRows: d.invalidRosterRows.length,
    rosterIdsMissingUniverse: d.rosterIdsMissingUniverse.length,
    duplicateRosterIds: d.duplicateRosterIds.length,
    duplicateRosterPlayersWithConflicts: d.duplicateRosterPlayersWithConflicts
  };
}

module.exports = {
  buildCanonicalPlayerRegistry,
  indexRosterSnapshots,
  registrySummary,
  rosterConflicts
};
