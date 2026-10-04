'use strict';

function evaluateSchema7ExecutionPreflight(executionPackage) {
  const blockers = [];
  if (!executionPackage || typeof executionPackage !== 'object') {
    blockers.push('Execution package is required');
  } else {
    if (executionPackage.executable !== true) blockers.push('Execution package is not authorized');
    if (executionPackage.target !== 'isolated-game-state-save') blockers.push('Execution target must be isolated-game-state-save');
    if (executionPackage.sourceMustBePreserved !== true) blockers.push('Source preservation is required');
    if (executionPackage.rollbackRequired !== true) blockers.push('Rollback capability is required');
    if (executionPackage.verifyAfterWrite !== true) blockers.push('Post-write verification is required');
    if (executionPackage.deleteSourceAllowed !== false) blockers.push('Source deletion must be forbidden');
    if (!executionPackage.candidate) blockers.push('Migration candidate is required');
    if (!executionPackage.backup) blockers.push('Verified backup is required');
  }

  return Object.freeze({
    kind: 'schema7-execution-preflight',
    version: 1,
    ready: blockers.length === 0,
    blockers: Object.freeze(blockers),
    sourceMutationAllowed: false,
    sourceDeletionAllowed: false,
    target: executionPackage && executionPackage.target || null
  });
}

module.exports = { evaluateSchema7ExecutionPreflight };
