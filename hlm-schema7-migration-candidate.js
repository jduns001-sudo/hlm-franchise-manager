'use strict';

const { createActiveStateMigrationDryRun } = require('./hlm-active-state-migration-dry-run');

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function prepareSchema7MigrationCandidate(snapshot, options = {}) {
  const dryRun = createActiveStateMigrationDryRun(snapshot, options);
  if (!dryRun.ready) {
    return Object.freeze({
      kind: 'schema7-migration-candidate',
      version: 1,
      ready: false,
      dryRunOnly: true,
      writeAuthorized: false,
      persistenceEnabled: false,
      blockers: dryRun.blockers,
      candidate: null,
      backup: dryRun.backup
    });
  }

  const candidate = cloneJson(snapshot);
  return Object.freeze({
    kind: 'schema7-migration-candidate',
    version: 1,
    ready: true,
    sourceSchema: 7,
    dryRunOnly: true,
    writeAuthorized: false,
    persistenceEnabled: false,
    sourcePreserved: true,
    blockers: Object.freeze([]),
    candidate,
    backup: dryRun.backup
  });
}

module.exports = { prepareSchema7MigrationCandidate };
