'use strict';

/**
 * Phase 1 Mission 4: deterministic Player field-authority resolver.
 *
 * Pure/read-only. Consumes a canonical registry record and optional runtime
 * overlays. It never mutates the registry, source JSON, or browser state.
 */

const hasValue = v => v !== undefined && v !== null && v !== '';
const positiveNumber = v => Number.isFinite(Number(v)) && Number(v) > 0;

function lastRosterValue(snapshots, field, predicate = hasValue) {
  for (let i = snapshots.length - 1; i >= 0; i -= 1) {
    const value = snapshots[i] && snapshots[i].row && snapshots[i].row[field];
    if (predicate(value)) return { value, sourceIndex: snapshots[i].sourceIndex };
  }
  return null;
}

function resolvePlayerRecord(registryRecord, options = {}) {
  if (!registryRecord || !registryRecord.canonical) throw new Error('canonical registry record required');

  const base = registryRecord.canonical;
  const snapshots = (registryRecord.sources && registryRecord.sources.rosterSnapshots) || [];
  const playerFix = options.playerFix || {};
  const playerOverride = options.playerOverride || {};
  const resolved = { ...base };
  const provenance = {};

  const set = (field, value, source, detail) => {
    if (!hasValue(value)) return;
    resolved[field] = value;
    provenance[field] = { source, ...(detail || {}) };
  };

  // Universe owns canonical identity and current base assignment.
  ['id', 'first', 'last', 'name', 'birthYear', 'retired', 'teamId', 'nation', 'shoots', 'height', 'type'].forEach(field => {
    if (hasValue(base[field])) provenance[field] = { source: 'universe' };
  });

  // Current prototype behavior: roster Overall wins only when positive.
  const rosterOvr = lastRosterValue(snapshots, 'ovr', positiveNumber);
  if (rosterOvr) set('ovr', Number(rosterOvr.value), 'roster', { sourceIndex: rosterOvr.sourceIndex });
  else if (hasValue(base.ovr)) provenance.ovr = { source: 'universe' };

  // Roster supplies fields absent/weak in Universe before PLAYER_FIXES.
  const rosterPotential = lastRosterValue(snapshots, 'potential');
  if (rosterPotential) set('potential', rosterPotential.value, 'roster', { sourceIndex: rosterPotential.sourceIndex });
  else if (hasValue(base.potential)) provenance.potential = { source: 'universe' };

  const rosterPosition = lastRosterValue(snapshots, 'pos') || lastRosterValue(snapshots, 'position');
  if (rosterPosition) set('position', rosterPosition.value, 'roster', { sourceIndex: rosterPosition.sourceIndex });

  // PLAYER_FIXES is the current app's explicit compatibility layer.
  ['position', 'potential'].forEach(field => {
    if (hasValue(playerFix[field])) set(field, playerFix[field], 'playerFix');
  });

  // Saved runtime overrides are highest authority for fields they contain.
  Object.keys(playerOverride).forEach(field => {
    if (field === 'id') return; // permanent identity cannot be overridden.
    if (hasValue(playerOverride[field])) set(field, playerOverride[field], 'playerOverride');
  });

  resolved.id = base.id;
  provenance.id = { source: 'universe', permanent: true };

  return { player: resolved, provenance };
}

module.exports = { resolvePlayerRecord };
