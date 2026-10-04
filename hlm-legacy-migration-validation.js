'use strict';

const { createLegacyMigrationPreview } = require('./hlm-legacy-migration');
const { validateGameStateEnvelope } = require('./hlm-game-state');
const { auditRecordIdentities } = require('./hlm-record-identity');
const { auditDraftPickIdentity } = require('./hlm-draft-pick-identity');

function duplicateIds(records) {
  const seen = new Map();
  (Array.isArray(records) ? records : []).forEach((record, index) => {
    const id = record && record.id;
    if (id === undefined || id === null || id === '') return;
    const key = String(id);
    const indexes = seen.get(key) || [];
    indexes.push(index);
    seen.set(key, indexes);
  });
  return Array.from(seen, ([id, indexes]) => ({ id, indexes }))
    .filter(group => group.indexes.length > 1);
}

function validateLegacyMigration(legacy, meta = {}) {
  const preview = createLegacyMigrationPreview(legacy, meta);
  const stateValidation = validateGameStateEnvelope(preview.state);
  const playerDuplicates = duplicateIds(preview.state.universe.players);
  const teamDuplicates = duplicateIds(preview.state.universe.teams);
  const contractIdentity = auditRecordIdentities(preview.state.assets.contracts, 'contract', 'contractId');
  const transactionIdentity = auditRecordIdentities(preview.state.activity.transactions, 'transaction', 'transactionId');
  const draftPickIdentity = auditDraftPickIdentity(preview.state.assets.draftPicks);

  const blockers = [];
  const warnings = preview.plan.warnings.slice();

  if (!stateValidation.valid) blockers.push({ code: 'INVALID_GAME_STATE_PREVIEW', errors: stateValidation.errors });
  if (playerDuplicates.length) blockers.push({ code: 'DUPLICATE_PLAYER_IDS', groups: playerDuplicates });
  if (teamDuplicates.length) blockers.push({ code: 'DUPLICATE_TEAM_IDS', groups: teamDuplicates });

  if (contractIdentity.migrationRequired) warnings.push({ code: 'CONTRACT_IDS_REQUIRE_MIGRATION', count: contractIdentity.missing.length + contractIdentity.invalid.length + contractIdentity.duplicates.length });
  if (transactionIdentity.migrationRequired) warnings.push({ code: 'TRANSACTION_IDS_REQUIRE_MIGRATION', count: transactionIdentity.missing.length + transactionIdentity.invalid.length + transactionIdentity.duplicates.length });
  if (!draftPickIdentity.permanentIdentityReady && draftPickIdentity.total > 0) warnings.push({ code: 'DRAFT_PICK_IDS_REQUIRE_MIGRATION', count: draftPickIdentity.total });
  if (preview.plan.deferred.length) warnings.push({ code: 'LEGACY_FIELDS_DEFERRED', fields: preview.plan.deferred.slice() });

  const classification = blockers.length ? 'blocked' : warnings.length ? 'warning' : 'safe';

  return {
    classification,
    safeToPersist: classification === 'safe',
    blockers,
    warnings,
    diagnostics: {
      stateValidation,
      playerDuplicates,
      teamDuplicates,
      contractIdentity,
      transactionIdentity,
      draftPickIdentity
    },
    preview
  };
}

module.exports = { duplicateIds, validateLegacyMigration };
