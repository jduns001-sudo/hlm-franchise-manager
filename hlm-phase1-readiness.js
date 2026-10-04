'use strict';

const { buildCanonicalPlayerSnapshot, validateCanonicalPlayerSnapshot } = require('./hlm-canonical-player-snapshot');
const { buildTeamReferenceRegistry, teamReferenceSummary } = require('./hlm-team-reference-registry');
const { auditMutableRecordIdentity } = require('./hlm-record-identity');
const { auditDraftPickIdentity } = require('./hlm-draft-pick-identity');

function auditPhase1Foundation(universe, roster, db = {}, options = {}) {
  const playerSnapshot = buildCanonicalPlayerSnapshot(universe, roster, options);
  const playerValidation = validateCanonicalPlayerSnapshot(playerSnapshot);
  const teamRegistry = buildTeamReferenceRegistry(universe);
  const mutableIdentity = auditMutableRecordIdentity(db);
  const universePicks = Array.isArray(universe && universe.draftPicks) ? universe.draftPicks : [];
  const rosterPicks = Array.isArray(roster && roster.draftPicks) ? roster.draftPicks : [];

  const blockers = [];
  if (!playerValidation.valid) blockers.push({ code: 'PLAYER_IDENTITY_INVALID', count: playerValidation.errors.length });
  if (playerSnapshot.diagnostics.duplicateUniverseIds.length) blockers.push({ code: 'DUPLICATE_UNIVERSE_PLAYER_ID', count: playerSnapshot.diagnostics.duplicateUniverseIds.length });
  if (teamRegistry.diagnostics.duplicateTeamIds.length) blockers.push({ code: 'DUPLICATE_TEAM_ID', count: teamRegistry.diagnostics.duplicateTeamIds.length });

  const deferredMigrations = [];
  if (mutableIdentity.contracts.migrationRequired) deferredMigrations.push('contract-permanent-ids');
  if (mutableIdentity.transactions.migrationRequired) deferredMigrations.push('transaction-permanent-ids');
  deferredMigrations.push('draft-pick-permanent-ids');

  return {
    phase: 1,
    player: { summary: playerSnapshot.summary, validation: playerValidation },
    teamReferences: teamReferenceSummary(teamRegistry),
    mutableIdentity,
    draftPicks: {
      universe: auditDraftPickIdentity(universePicks),
      roster: auditDraftPickIdentity(rosterPicks)
    },
    blockers,
    deferredMigrations,
    readyForPhase2Planning: blockers.length === 0
  };
}

module.exports = { auditPhase1Foundation };
