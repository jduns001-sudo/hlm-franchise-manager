'use strict';

/**
 * Mission 664: conservative, read-only organization reference classification.
 * No player eligibility, roster reassignment, or inferred organization records.
 */
function validId(value) {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function createOrganizationReferenceClassifier(teams) {
  const knownTeamIds = new Set();
  const diagnostics = [];
  for (const [index, team] of (Array.isArray(teams) ? teams : []).entries()) {
    const id = team && team.id;
    if (!validId(id) || id <= 0 || id === 100) {
      diagnostics.push({ code: 'INVALID_TEAM_ID', index, value: id });
    } else if (knownTeamIds.has(id)) {
      diagnostics.push({ code: 'DUPLICATE_TEAM_ID', index, teamId: id });
    } else {
      knownTeamIds.add(id);
    }
  }

  function classify(rawTeamId) {
    if (!validId(rawTeamId)) {
      return { status: 'invalid-reference', teamId: rawTeamId, confidence: 'invalid' };
    }
    if (knownTeamIds.has(rawTeamId)) {
      return { status: 'known-team', teamId: rawTeamId, confidence: 'confirmed' };
    }
    if (rawTeamId === -1) {
      return { status: 'sentinel-no-team', teamId: -1, confidence: 'inferred', eligibleFreeAgent: null };
    }
    if (rawTeamId === 0) {
      return { status: 'sentinel-unassigned', teamId: 0, confidence: 'inferred', eligibleFreeAgent: null };
    }
    if (rawTeamId === 100) {
      return { status: 'sentinel-legacy-unknown', teamId: 100, confidence: 'ambiguous', eligibleFreeAgent: null };
    }
    if (rawTeamId > 0) {
      return { status: 'external-organization-unresolved', teamId: rawTeamId, confidence: 'unknown', eligibleFreeAgent: null };
    }
    return { status: 'other-negative-sentinel', teamId: rawTeamId, confidence: 'unknown', eligibleFreeAgent: null };
  }

  function classifyPlayers(players) {
    const entries = [];
    for (const [index, player] of (Array.isArray(players) ? players : []).entries()) {
      entries.push({ playerId: player && player.id, sourceIndex: index, ...classify(player && player.teamId) });
    }
    return entries;
  }

  return {
    kind: 'organization-reference-classifier',
    version: 1,
    knownTeamIds: [...knownTeamIds],
    diagnostics,
    classify,
    classifyPlayers,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createOrganizationReferenceClassifier };
