'use strict';

const { normalizeFrontOfficeSnapshot } = require('./hlm-front-office-snapshot-normalizer');

function auditFrontOfficeSnapshot(source) {
  const normalized = normalizeFrontOfficeSnapshot(source);
  const state = normalized.state;
  const warnings = [];
  const blockers = [];

  if (state.schema == null) warnings.push('Front Office snapshot has no schema value');
  if (!state.settings || state.settings.controlledTeamId == null) {
    warnings.push('Controlled team is not set in the snapshot');
  }

  const playerIds = new Set();
  let duplicatePlayerIds = 0;
  for (const player of state.players) {
    if (!player || player.id == null) continue;
    const id = String(player.id);
    if (playerIds.has(id)) duplicatePlayerIds += 1;
    playerIds.add(id);
  }
  if (duplicatePlayerIds) blockers.push('Duplicate player IDs: ' + duplicatePlayerIds);

  const teamIds = new Set();
  let duplicateTeamIds = 0;
  for (const team of state.teams) {
    if (!team || team.id == null) continue;
    const id = String(team.id);
    if (teamIds.has(id)) duplicateTeamIds += 1;
    teamIds.add(id);
  }
  if (duplicateTeamIds) blockers.push('Duplicate team IDs: ' + duplicateTeamIds);

  return Object.freeze({
    kind: 'front-office-snapshot-audit',
    version: 1,
    readOnly: true,
    sourceSchema: normalized.sourceSchema,
    counts: Object.freeze({
      players: state.players.length,
      teams: state.teams.length,
      contracts: state.contracts.length,
      transactions: state.transactions.length,
      draftPicks: state.draftPicks.length,
      prospects: state.prospects.length
    }),
    duplicatePlayerIds,
    duplicateTeamIds,
    warnings: Object.freeze(warnings),
    blockers: Object.freeze(blockers),
    readyForReadOnlyDiagnostics: blockers.length === 0
  });
}

module.exports = { auditFrontOfficeSnapshot };
