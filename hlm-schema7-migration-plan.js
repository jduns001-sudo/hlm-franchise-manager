'use strict';

const { evaluateSchema7CandidateReadiness } = require('./hlm-schema7-candidate-readiness');

function createSchema7MigrationPlan(snapshot, options = {}) {
  const readiness = evaluateSchema7CandidateReadiness(snapshot, options);
  const steps = Object.freeze([
    'capture-source-state',
    'verify-backup-round-trip',
    'prepare-detached-candidate',
    'validate-candidate',
    'require-explicit-write-authorization',
    'write-isolated-target',
    'reload-and-validate-target',
    'rollback-on-verification-failure',
    'preserve-source-state'
  ]);

  return Object.freeze({
    kind: 'schema7-migration-plan',
    version: 1,
    readyForAuthorization: readiness.ready,
    executionAllowed: false,
    writeAuthorized: false,
    persistenceEnabled: false,
    sourceMustBePreserved: true,
    rollbackRequired: true,
    target: 'isolated-game-state-save',
    steps,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    candidate: readiness.ready ? readiness.candidate : null,
    backup: readiness.backup
  });
}

module.exports = { createSchema7MigrationPlan };
