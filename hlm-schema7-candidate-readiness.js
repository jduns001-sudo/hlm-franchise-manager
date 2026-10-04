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
      backupVerified: Boolean(prepared.backup),
      candidateValid: false,
      writeAuthorized: false,
      persistenceEnabled: false,
      blockers: prepared.blockers || Object.freeze(['Migration candidate preparation failed']),
      warnings: Object.freeze([]),
      candidate: null,
      backup: prepared.backup || null
    });
  }

  const validation = validateSchema7MigrationCandidate(prepared.candidate);
  const blockers = Object.freeze([...(prepared.blockers || []), ...validation.blockers]);
  return Object.freeze({
    kind: 'schema7-candidate-readiness',
    version: 1,
    ready: blockers.length === 0 && validation.valid,
    backupVerified: Boolean(prepared.backup),
    candidateValid: validation.valid,
    writeAuthorized: false,
    persistenceEnabled: false,
    blockers,
    warnings: validation.warnings,
    counts: validation.counts,
    candidate: validation.valid ? prepared.candidate : null,
    backup: prepared.backup || null
  });
}

module.exports = { evaluateSchema7CandidateReadiness };
