'use strict';

const { createFrontOfficeRuntimeAdapter, inspectFrontOfficeRuntime } = require('./hlm-front-office-runtime-adapter');
const { prepareLegacyMigration } = require('./hlm-legacy-migration-orchestrator');

/**
 * Read-only preflight for a future live Front Office connection.
 * It consumes the host's existing readState/readLegacyState function and
 * never receives a write capability.
 */
async function preflightFrontOfficeState(readLegacyState, options = {}) {
  const adapter = createFrontOfficeRuntimeAdapter({ readLegacyState });
  const runtime = await inspectFrontOfficeRuntime(adapter);
  const snapshot = await adapter.readLegacySnapshot();
  const prepared = prepareLegacyMigration(snapshot, options.metadata || {});

  const blockers = [];
  const warnings = [];
  if (!prepared || prepared.readyForPersistencePlanning !== true) blockers.push('LEGACY_MIGRATION_NOT_READY');
  if (prepared && prepared.validation) {
    for (const item of prepared.validation.blockers || []) blockers.push(item);
    for (const item of prepared.validation.warnings || []) warnings.push(item);
  }

  return {
    ready: blockers.length === 0,
    readOnly: true,
    runtime,
    migration: {
      readyForPersistencePlanning: !!(prepared && prepared.readyForPersistencePlanning),
      blockers,
      warnings
    }
  };
}

module.exports = { preflightFrontOfficeState };
