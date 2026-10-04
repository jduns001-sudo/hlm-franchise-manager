'use strict';

const { prepareSchema7MigrationCandidate } = require('./hlm-schema7-migration-candidate');
const { validateSchema7MigrationCandidate } = require('./hlm-schema7-candidate-validator');

function evaluateSchema7CandidateReadiness(snapshot, options = {}) {
  const prepared = prepareSchema7MigrationCandidate(snapshot, options);
  if (!prepared.ready || !prepared.candidate) {
    return Object.freeze({
      kind: 'schema7-candidate-readiness',
      version: 1,
      ready: false,
      writeAuthorized: false,
      persistenceEnabled: false,
      blockers: prepared.blockers,
      warnings: Object.freeze([]),
      candidate: null,
      backup: prepared.backup || null
    });
  }

  const validation = validateSchema7MigrationCandidate(prepared.candidate);
  return Object.freeze({
    kind: 'schema7-candidate-readiness',
    version: 1,
    ready: validation.valid,
    sourceSchema: prepared.sourceSchema,
    backupVerified: Boolean(prepared.backup),
    candidateValidated: validation.valid,
    writeAuthorized: false,
    persistenceEnabled: false,
    blockers: validation.blockers,
    warnings: validation.warnings,
    candidate: validation.valid ? prepared.candidate : null,
    backup: prepared.backup
  });
}

module.exports = { evaluateSchema7CandidateReadiness };
