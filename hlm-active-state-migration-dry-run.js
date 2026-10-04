'use strict';

const { evaluateActiveStateBackupReadiness } = require('./hlm-active-state-backup-readiness');

function createActiveStateMigrationDryRun(snapshot, options = {}) {
  const readiness = evaluateActiveStateBackupReadiness(snapshot, {
    createdAt: options.createdAt || null,
    label: options.label || 'pre-migration-dry-run'
  });

  const steps = Object.freeze([
    'read-current-front-office-state',
    'verify-schema-7',
    'create-detached-backup',
    'verify-backup-round-trip',
    'prepare-migration-candidate',
    'validate-candidate-before-any-write'
  ]);

  return Object.freeze({
    kind: 'active-state-migration-dry-run',
    version: 1,
    ready: readiness.ready,
    sourceSchema: readiness.sourceSchema,
    backupVerified: readiness.backupVerified,
    dryRunOnly: true,
    writeAuthorized: false,
    persistenceEnabled: false,
    preservesSourceState: true,
    steps,
    blockers: readiness.blockers,
    backup: readiness.backup
  });
}

module.exports = { createActiveStateMigrationDryRun };
