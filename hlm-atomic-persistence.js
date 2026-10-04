'use strict';

const { createBackupFirstMigrationPackage } = require('./hlm-backup-first-migration');

function createAtomicPersistencePlan(legacy, meta = {}) {
  const migration = createBackupFirstMigrationPackage(legacy, meta);
  return {
    version: 1,
    precondition: {
      backupValidated: migration.backupInspection.valid === true,
      migrationReady: migration.prepared.readyForPersistencePlanning === true
    },
    backupText: migration.backupText,
    candidateState: migration.state,
    transaction: {
      writeTarget: 'isolated-game-state-save',
      preserveLegacySource: true,
      verifyAfterWrite: true,
      rollbackOnFailure: true,
      deleteLegacyAfterSuccess: false
    },
    authorization: null,
    executable: false,
    executed: false,
    rollbackPerformed: false
  };
}

function authorizeAtomicPersistencePlan(plan, authorization = {}) {
  const check = validateAtomicPersistencePlan(plan);
  if (!check.valid) {
    const e = new Error('Invalid atomic persistence plan');
    e.code = 'INVALID_PERSISTENCE_PLAN'; e.errors = check.errors; throw e;
  }
  if (authorization.explicitConfirmation !== true) {
    const e = new Error('Explicit persistence authorization is required');
    e.code = 'PERSISTENCE_AUTHORIZATION_REQUIRED'; throw e;
  }
  return {
    ...plan,
    authorization: {
      type: 'explicit-user-confirmation',
      confirmed: true,
      replaceExisting: authorization.replaceExisting === true
    },
    executable: true
  };
}

function validateAtomicPersistencePlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') errors.push('PLAN_REQUIRED');
  else {
    if (!plan.precondition || plan.precondition.backupValidated !== true) errors.push('BACKUP_NOT_VALIDATED');
    if (!plan.precondition || plan.precondition.migrationReady !== true) errors.push('MIGRATION_NOT_READY');
    if (!plan.transaction || plan.transaction.preserveLegacySource !== true) errors.push('LEGACY_SOURCE_NOT_PRESERVED');
    if (!plan.transaction || plan.transaction.verifyAfterWrite !== true) errors.push('POST_WRITE_VERIFY_REQUIRED');
    if (!plan.transaction || plan.transaction.rollbackOnFailure !== true) errors.push('ROLLBACK_REQUIRED');
    if (plan.transaction && plan.transaction.deleteLegacyAfterSuccess !== false) errors.push('LEGACY_DELETE_FORBIDDEN');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { createAtomicPersistencePlan, authorizeAtomicPersistencePlan, validateAtomicPersistencePlan };
