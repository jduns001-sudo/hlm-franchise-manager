'use strict';

/**
 * Phase 1 Mission 5: compose the Mission 3 registry and Mission 4 resolver into
 * a read-only canonical Player snapshot suitable as a future GameState input.
 */

const { buildCanonicalPlayerRegistry, registrySummary } = require('./hlm-canonical-data');
const { resolvePlayerRecord } = require('./hlm-player-resolver');

function lookupByPlayerId(source, playerId) {
  if (!source) return {};
  if (source instanceof Map) return source.get(playerId) || {};
  return source[playerId] || source[String(playerId)] || {};
}

function buildCanonicalPlayerSnapshot(universe, roster, options = {}) {
  const registry = buildCanonicalPlayerRegistry(universe, roster);
  const playerFixes = options.playerFixes || {};
  const playerOverrides = options.playerOverrides || {};
  const players = [];
  const provenanceByPlayerId = new Map();

  for (const [playerId, record] of registry.playersById) {
    const resolved = resolvePlayerRecord(record, {
      playerFix: lookupByPlayerId(playerFixes, playerId),
      playerOverride: lookupByPlayerId(playerOverrides, playerId)
    });
    players.push(resolved.player);
    provenanceByPlayerId.set(playerId, resolved.provenance);
  }

  return {
    players,
    playersById: new Map(players.map(player => [player.id, player])),
    provenanceByPlayerId,
    diagnostics: registry.diagnostics,
    summary: registrySummary(registry)
  };
}

function validateCanonicalPlayerSnapshot(snapshot) {
  const errors = [];
  const seen = new Set();

  (snapshot && snapshot.players || []).forEach((player, index) => {
    if (!Number.isSafeInteger(Number(player && player.id)) || Number(player.id) <= 0) {
      errors.push({ code: 'INVALID_PLAYER_ID', index, playerId: player && player.id });
      return;
    }
    const id = Number(player.id);
    if (seen.has(id)) errors.push({ code: 'DUPLICATE_PLAYER_ID', index, playerId: id });
    seen.add(id);
  });

  if (snapshot && snapshot.playersById && snapshot.playersById.size !== seen.size) {
    errors.push({
      code: 'PLAYER_INDEX_SIZE_MISMATCH',
      playerCount: seen.size,
      indexCount: snapshot.playersById.size
    });
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  buildCanonicalPlayerSnapshot,
  validateCanonicalPlayerSnapshot
};
