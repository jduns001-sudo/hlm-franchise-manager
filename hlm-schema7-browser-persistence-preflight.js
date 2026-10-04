'use strict';

const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { LEGACY_LOCAL_STORAGE_KEY } = require('./hlm-schema7-browser-gamestate-bridge');
const {
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE,
  authorizeSchema7BrowserMigration
} = require('./hlm-schema7-browser-migration-authorization');

function evaluateSchema7BrowserPersistencePreflight(storage, slotId, snapshot, authorization, options = {}) {
  const blockers = [];
  const authorizationResult = authorizeSchema7BrowserMigration(snapshot, authorization, options);

  if (!authorizationResult.authorized) blockers.push(...authorizationResult.blockers);
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
    blockers.push('Web Storage-compatible storage is required');
  }

  const normalizedSlotId = typeof slotId === 'string' ? slotId.trim() : '';
  if (!normalizedSlotId) blockers.push('Save slot ID is required');

  let targetSlotOccupied = false;
  if (!blockers.length) {
    try {
      const repository = createBrowserSaveAdapter(storage, DEFAULT_STORAGE_KEY);
      targetSlotOccupied = repository.has(normalizedSlotId);
      if (targetSlotOccupied) blockers.push('Target save slot already exists');
    } catch (error) {
      blockers.push(error && error.message ? error.message : 'Browser save storage preflight failed');
    }
  }

  return Object.freeze({
    kind: 'schema7-browser-persistence-preflight',
    version: 1,
    ready: blockers.length === 0,
    authorized: authorizationResult.authorized,
    authorizationPhraseAccepted: authorization === BROWSER_MIGRATION_AUTHORIZATION_PHRASE,
    slotId: normalizedSlotId || null,
    storageKey: DEFAULT_STORAGE_KEY,
    legacyStorageKey: LEGACY_LOCAL_STORAGE_KEY,
    targetSlotOccupied,
    sourceSchema: authorizationResult.sourceSchema,
    targetSchemaVersion: authorizationResult.targetSchemaVersion,
    sourcePreserved: authorizationResult.sourcePreserved,
    roundTripVerified: authorizationResult.roundTripVerified,
    persistenceEnabled: false,
    writePerformed: false,
    sourceMutationAllowed: false,
    sourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = { evaluateSchema7BrowserPersistencePreflight };
