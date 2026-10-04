'use strict';

const { inspectRuntimeMigrationReadiness } = require('./hlm-runtime-migration-preflight');
const { createMigrationCommand } = require('./hlm-migration-command');
const { runMigrationCommand } = require('./hlm-migration-command-runner');

function prepareRuntimeMigration(storage, slotId = 'primary', metadata = {}) {
  const preflight = inspectRuntimeMigrationReadiness(storage, slotId);
  return {
    preflight,
    command: preflight.ready ? createMigrationCommand(slotId, metadata) : null,
    executable: false,
    requiresExplicitConfirmation: true
  };
}

function confirmAndRunRuntimeMigration(prepared, storage, confirmation) {
  if (!prepared || !prepared.preflight || prepared.preflight.ready !== true || !prepared.command) {
    return { result: { executed:false, reason:'PREFLIGHT_NOT_READY' }, events:[], error:null };
  }
  if (confirmation !== true) {
    return runMigrationCommand(prepared.command, storage, { confirmed:false });
  }
  return runMigrationCommand(prepared.command, storage, { confirmed:true });
}

module.exports = { prepareRuntimeMigration, confirmAndRunRuntimeMigration };
