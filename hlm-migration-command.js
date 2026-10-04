'use strict';

const { createAtomicPersistencePlan, authorizeAtomicPersistencePlan } = require('./hlm-atomic-persistence');
const { executeBrowserPersistence, LEGACY_STORAGE_KEY } = require('./hlm-browser-persistence-integration');

const MIGRATION_COMMAND = 'MIGRATE_LEGACY_FRONT_OFFICE';

function createMigrationCommand(slotId, metadata = {}) {
  if (typeof slotId !== 'string' || !slotId.trim()) throw new TypeError('slotId is required');
  return { type: MIGRATION_COMMAND, slotId: slotId.trim(), metadata: { ...metadata }, requiresExplicitConfirmation: true };
}

function executeMigrationCommand(command, storage, options = {}) {
  if (!command || command.type !== MIGRATION_COMMAND) throw new Error('Invalid migration command');
  if (options.confirmed !== true) {
    return { executed: false, reason: 'EXPLICIT_CONFIRMATION_REQUIRED', command };
  }
  const raw = storage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return { executed: false, reason: 'LEGACY_SOURCE_NOT_FOUND', command };
  let legacy;
  try { legacy = JSON.parse(raw); }
  catch (cause) {
    const error = new Error('Legacy source is invalid JSON'); error.code = 'INVALID_LEGACY_SOURCE'; error.cause = cause; throw error;
  }
  const plan = createAtomicPersistencePlan(legacy, { ...command.metadata, saveId: command.slotId });
  const authorizedPlan = authorizeAtomicPersistencePlan(plan, {
    explicitConfirmation: true,
    replaceExisting: options.replaceExisting === true
  });
  const result = executeBrowserPersistence(authorizedPlan, storage, command.slotId, command.metadata);
  return { ...result, commandType: command.type };
}

module.exports = { MIGRATION_COMMAND, createMigrationCommand, executeMigrationCommand };
