#!/usr/bin/env node
// Phase 1 read-only data validator. Not loaded by app.html. Never writes files.
// Usage: node hlm-data-validate.js [--json]
const fs = require('fs');
const path = require('path');
const read = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const SENTINEL_TEAM_IDS = new Set([-1, 0, 100]); // distinct meanings; never treat as equivalent
const num = v => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);

function validate(U, R) {
  const issues = [], counts = {};
  const add = (code, severity, detail) => issues.push({ code, severity, detail });
  const teams = U.teams || [], players = U.players || [], picks = U.draftPicks || [];
  const rosterRows = R.players || [], rosterPicks = R.draftPicks || [];
  const teamIds = new Set(teams.map(t => num(t.id)));

  const dupIds = (rows, key = 'id') => {
    const m = new Map();
    rows.forEach(r => { const k = String(r[key]); m.set(k, (m.get(k) || []).concat(r)); });
    return [...m].filter(([, v]) => v.length > 1);
  };

  counts.universePlayers = players.length;
  counts.universeTeams = teams.length;
  counts.rosterRows = rosterRows.length;
  counts.universeDuplicatePlayerIds = dupIds(players).length;
  counts.universeDuplicateTeamIds = dupIds(teams).length;
  if (counts.universeDuplicatePlayerIds) add('UNIVERSE_DUP_PLAYER_ID', 'error', counts.universeDuplicatePlayerIds);
  if (counts.universeDuplicateTeamIds) add('UNIVERSE_DUP_TEAM_ID', 'error', counts.universeDuplicateTeamIds);

  const rd = dupIds(rosterRows);
  counts.rosterDistinctIds = new Set(rosterRows.map(r => String(r.id))).size;
  counts.rosterDuplicateIds = rd.length;
  counts.rosterDuplicateIdsWithConflictingOvr = rd.filter(([, v]) => new Set(v.map(x => String(x.ovr))).size > 1).length;
  counts.rosterDuplicateIdsWithConflictingTeam = rd.filter(([, v]) => new Set(v.map(x => String(x.teamId))).size > 1).length;
  if (rd.length) add('ROSTER_DUP_PLAYER_ID', 'warning', `${rd.length} ids, ${counts.rosterDuplicateIdsWithConflictingOvr} with conflicting ovr (overlay currently lets the last row win)`);

  const uById = new Map(players.map(p => [String(p.id), p]));
  counts.rosterIdsNotInUniverse = [...new Set(rosterRows.map(r => String(r.id)))].filter(i => !uById.has(i)).length;
  if (counts.rosterIdsNotInUniverse) add('ROSTER_ID_NOT_IN_UNIVERSE', 'error', counts.rosterIdsNotInUniverse);
  const rIds = new Set(rosterRows.map(r => String(r.id)));
  counts.universePlayersWithoutRosterRow = players.filter(p => !rIds.has(String(p.id))).length;

  counts.universePlayersWithoutPosition = players.filter(p => !p.position).length;
  if (counts.universePlayersWithoutPosition) add('UNIVERSE_NO_POSITION', 'info', 'positions come from roster overlay / PLAYER_FIXES');

  let ovrDisagree = 0;
  const seen = new Set();
  for (const r of rosterRows) {
    const k = String(r.id); if (seen.has(k)) continue; seen.add(k);
    const u = uById.get(k); if (u && num(r.ovr) != null && num(r.ovr) !== num(u.ovr)) ovrDisagree++;
  }
  counts.ovrDisagreementsUniverseVsRoster = ovrDisagree;

  const active = players.filter(p => !p.retired);
  const byKind = { sentinel: {}, inTeamTable: 0, notInTeamTable: 0 };
  active.forEach(p => {
    const t = num(p.teamId);
    if (SENTINEL_TEAM_IDS.has(t)) byKind.sentinel[t] = (byKind.sentinel[t] || 0) + 1;
    else if (teamIds.has(t)) byKind.inTeamTable++;
    else byKind.notInTeamTable++;
  });
  counts.activePlayerTeamKinds = byKind;

  const abbr = new Map();
  teams.forEach(t => abbr.set(t.abbr, (abbr.get(t.abbr) || 0) + 1));
  counts.duplicateTeamAbbreviations = [...abbr].filter(([, c]) => c > 1).length;
  if (counts.duplicateTeamAbbreviations) add('TEAM_ABBR_NOT_UNIQUE', 'info', 'never match teams by abbreviation');

  // Identity mirrors app.html draftPickIdFor(): league, year, original team, round (+ occurrence for repeats).
  const pickKey = p => [p.league ?? 0, p.draftYear ?? p.year, p.originalTeamId ?? p.teamId, p.round].join(':');
  const collisions = rows => { const m = new Map(); rows.forEach(p => m.set(pickKey(p), (m.get(pickKey(p)) || 0) + 1)); return [...m].filter(([, c]) => c > 1).length; };
  const pk = new Map(); picks.forEach(p => pk.set(pickKey(p), (pk.get(pickKey(p)) || 0) + 1));
  counts.rosterPickNaturalKeyCollisions = collisions(rosterPicks);
  counts.picksMissingIdentityFields = picks.concat(rosterPicks).filter(p => num(p.year ?? p.draftYear) == null || num(p.round) == null || num(p.originalTeamId ?? p.teamId) == null).length;
  counts.universePicksOriginalNotInTeamTable = picks.filter(p => !teamIds.has(num(p.originalTeamId))).length;
  counts.rosterPicksOriginalNotInTeamTable = rosterPicks.filter(p => !teamIds.has(num(p.originalTeamId))).length;
  counts.rosterPicksOwnerMissing = rosterPicks.filter(p => num(p.currentTeamId) == null).length;
  counts.universePicks = picks.length;
  counts.universePicksWithoutId = picks.filter(p => p.id == null).length;
  counts.universePicksOwnerNotInTeamTable = picks.filter(p => !teamIds.has(num(p.teamId))).length;
  counts.universePickNaturalKeyCollisions = [...pk].filter(([, c]) => c > 1).length;
  counts.rosterPicks = rosterPicks.length;
  counts.rosterPicksWithoutId = rosterPicks.filter(p => p.id == null).length;
  counts.rosterPicksOwnerNotInTeamTable = rosterPicks.filter(p => !teamIds.has(num(p.currentTeamId ?? p.teamId))).length;
  if (counts.universePicksWithoutId || counts.rosterPicksWithoutId) add('PICK_NO_PERMANENT_ID', 'info', 'source files carry no pickId; app.html derives runtime DP- ids');
  if (counts.universePickNaturalKeyCollisions) add('PICK_IDENTITY_COLLISION', 'warning', `${counts.universePickNaturalKeyCollisions} Universe keys repeat; derived ids depend on file order (occurrence suffix)`);
  if (counts.universePicksOwnerNotInTeamTable) add('PICK_OWNER_NOT_IN_TEAM_TABLE', 'warning', `${counts.universePicksOwnerNotInTeamTable} Universe picks`);
  // Not checkable with current data: whether a team in the table is an NHL franchise, and whether a pick's recorded owner is correct.

  const rosterInvalid = rosterRows.filter(r => !Number.isSafeInteger(num(r.id)) || num(r.id) <= 0).length;
  counts.rosterRowsInvalidId = rosterInvalid;
  if (rosterInvalid) add('INVALID_ROSTER_PLAYER_ID', 'error', rosterInvalid);
  const sentinelInTable = [...SENTINEL_TEAM_IDS].filter(i => teamIds.has(i));
  counts.sentinelIdsPresentInTeamTable = sentinelInTable.length;
  if (sentinelInTable.length) add('SENTINEL_ID_IN_TEAM_TABLE', 'error', sentinelInTable.join(','));
  const invalid = players.filter(p => !Number.isSafeInteger(num(p.id)) || num(p.id) <= 0).length;
  counts.universePlayersInvalidId = invalid;
  if (invalid) add('INVALID_PLAYER_ID', 'error', invalid);

  return { counts, issues, errors: issues.filter(i => i.severity === 'error').length };
}

module.exports = { validate, SENTINEL_TEAM_IDS };
if (require.main === module) {
  const out = validate(read('hlm-universe.json'), read('hlm-roster-2026.json'));
  if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 2));
  else {
    console.log('HLM data validation (read-only)');
    console.log(JSON.stringify(out.counts, null, 2));
    out.issues.forEach(i => console.log(`[${i.severity}] ${i.code}: ${i.detail}`));
    console.log(`errors: ${out.errors}`);
  }
  process.exitCode = out.errors ? 1 : 0;
}
