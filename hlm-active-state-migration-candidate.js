'use strict';

const { evaluateActiveStateBackupReadiness } = require('./hlm-active-state-backup-readiness');
const { restoreCandidateFromBackup } = require('./hlm-active-state-backup-contract');

function createActiveStateMigrationCandidate(snapshot, metadata = {}) {
  const readiness = evaluateActiveStateBackupReadiness(snapshot, metadata);
  if (!readiness.ready || !readiness.backupVerified || !readiness.backup) {
    const error = new Error('Verified active-state backup is required before creating a migration candidate');
    error.code = 'ACTIVE_STATE_BACKUP_NOT_READY';
    error.readiness = readiness;
    throw error;
  }

  const candidate = restoreCandidateFromBackup(readiness.backup);
  return Object.freeze({
    kind: 'active-state-migration-candidate',
    version: 1,
    sourceSchema: readiness.sourceSchema,
    targetSchema: null,
    candidate,
    backup: readiness.backup,
    backupVerified: true,
    migrationApplied: false,
    writeAuthorized: false,
    persistenceEnabled: false
  });
}

module.exports = { createActiveStateMigrationCandidate };
