'use strict';

/**
 * Phase 1 Mission 8: read-only DraftPick identity audit.
 * Existing prototype IDs are inspected, never promoted to permanent identity.
 */

function pickNaturalKey(pick) {
  const league = pick && (pick.leagueId ?? pick.league ?? '');
  const year = pick && (pick.year ?? pick.season ?? '');
  const original = pick && (pick.originalTeamId ?? pick.originalOwnerTeamId ?? '');
  const round = pick && (pick.round ?? '');
  return [league, year, original, round].map(String).join('|');
}

function auditDraftPickIdentity(picks) {
  const rows = Array.isArray(picks) ? picks : [];
  const keyGroups = new Map();
  const existingIdGroups = new Map();

  rows.forEach((pick, index) => {
    const key = pickNaturalKey(pick);
    const group = keyGroups.get(key) || [];
    group.push(index);
    keyGroups.set(key, group);

    const id = pick && (pick.pickId ?? pick.draftPickId ?? pick.id);
    if (id !== undefined && id !== null && id !== '') {
      const idGroup = existingIdGroups.get(String(id)) || [];
      idGroup.push(index);
      existingIdGroups.set(String(id), idGroup);
    }
  });

  const repeatedNaturalKeys = [];
  for (const [key, indexes] of keyGroups) {
    if (indexes.length > 1) repeatedNaturalKeys.push({ key, indexes: indexes.slice(), count: indexes.length });
  }

  const duplicateExistingIds = [];
  for (const [id, indexes] of existingIdGroups) {
    if (indexes.length > 1) duplicateExistingIds.push({ id, indexes: indexes.slice(), count: indexes.length });
  }

  const withoutExistingId = rows.reduce((count, pick) => {
    const id = pick && (pick.pickId ?? pick.draftPickId ?? pick.id);
    return count + ((id === undefined || id === null || id === '') ? 1 : 0);
  }, 0);

  return {
    total: rows.length,
    withoutExistingId,
    repeatedNaturalKeys,
    duplicateExistingIds,
    permanentIdentityReady: false,
    reason: 'DraftPick permanent IDs require a migration/source-authority decision; natural-key occurrence order is not permanent identity.'
  };
}

function draftPickReference(pick, sourceIndex) {
  return {
    sourceIndex,
    prototypeId: pick && (pick.pickId ?? pick.draftPickId ?? pick.id) || null,
    naturalKey: pickNaturalKey(pick),
    originalTeamId: pick ? (pick.originalTeamId ?? pick.originalOwnerTeamId ?? null) : null,
    currentOwnerTeamId: pick ? (pick.currentOwnerTeamId ?? pick.ownerTeamId ?? null) : null,
    year: pick ? (pick.year ?? pick.season ?? null) : null,
    round: pick ? (pick.round ?? null) : null
  };
}

module.exports = { pickNaturalKey, auditDraftPickIdentity, draftPickReference };
