'use strict';

const { executeMigrationCommand } = require('./hlm-migration-command');
const { migrationEventsForResult, migrationFailureEvent } = require('./hlm-migration-events');

function runMigrationCommand(command, storage, options = {}) {
  try {
    const result = executeMigrationCommand(command, storage, options);
    return { result, events: migrationEventsForResult(command, result), error: null };
  } catch (error) {
    return { result: null, events: [migrationFailureEvent(command, error)], error };
  }
}

module.exports = { runMigrationCommand };
