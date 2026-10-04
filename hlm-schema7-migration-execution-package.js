'use strict';

const { authorizeSchema7Migration } = require('./hlm-schema7-migration-authorization');

function createSchema7MigrationExecutionPackage(snapshot, authorization, options = {}) {
  const auth = authorizeSchema7Migration(snapshot, authorization, options);
  if (!auth.authorized) {
    return Object.freeze({
      kind: 'schema7-migration-execution-package',
      version: 1,
      executable: false,
      blockers: auth.blockers,
      target: auth.target,
      sourceMustBePreserved: true,
      rollbackRequired: true,
      candidate: null,
      backup: auth.backup
    });
  }

  return Object.freeze({
    kind: 'schema7-migration-execution-package',
    version: 1,
    executable: true,
    target: 'isolated-game-state-save',
    sourceMustBePreserved: true,
    rollbackRequired: true,
    verifyAfterWrite: true,
    deleteSourceAllowed: false,
    candidate: auth.candidate,
    backup: auth.backup,
    blockers: Object.freeze([])
  });
}

module.exports = { createSchema7MigrationExecutionPackage };
