'use strict';

const { createLegacyMigrationPreview } = require('./hlm-legacy-migration');
const { validateLegacyMigration } = require('./hlm-legacy-migration-validation');
const { migrateContractIdentities } = require('./hlm-contract-identity-migration');
const { migrateTransactionIdentities } = require('./hlm-transaction-identity-migration');
const { auditDraftPickIdentity } = require('./hlm-draft-pick-identity');

function prepareLegacyMigration(legacy, meta = {}) {
  const before = validateLegacyMigration(legacy, meta);
  const preview = createLegacyMigrationPreview(legacy, meta);
  const contracts = migrateContractIdentities(preview.state.assets.contracts);
  const transactions = migrateTransactionIdentities(preview.state.activity.transactions);

  preview.state.assets.contracts = contracts.contracts;
  preview.state.activity.transactions = transactions.transactions;

  const draftPicks = auditDraftPickIdentity(preview.state.assets.draftPicks);
  const unresolved = [];
  if (!draftPicks.permanentIdentityReady && draftPicks.total > 0) {
    unresolved.push({ code: 'DRAFT_PICK_IDENTITY_UNRESOLVED', count: draftPicks.total });
  }
  if (preview.plan.deferred.length) {
    unresolved.push({ code: 'DEFERRED_LEGACY_FIELDS', fields: preview.plan.deferred.slice() });
  }

  return {
    state: preview.state,
    before,
    transformations: {
      contractsChanged: contracts.changed,
      transactionsChanged: transactions.changed
    },
    unresolved,
    readyForPersistencePlanning: before.blockers.length === 0 && unresolved.length === 0,
    persistencePerformed: false
  };
}

module.exports = { prepareLegacyMigration };
