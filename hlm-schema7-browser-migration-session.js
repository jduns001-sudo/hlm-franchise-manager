'use strict';

const {
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE,
  authorizeSchema7BrowserMigration
} = require('./hlm-schema7-browser-migration-authorization');
const { executeSchema7ControlledBrowserPersistence } = require('./hlm-schema7-controlled-browser-persistence');
const { loadVerifiedBrowserGameState } = require('./hlm-verified-browser-gamestate-load');
const { createBrowserMigrationRecoveryCheckpoint } = require('./hlm-browser-migration-recovery-checkpoint');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');

function createSchema7BrowserMigrationSession(storage, slotId, metadata = {}) {
  let authorization = null;

  return Object.freeze({
    kind: 'schema7-browser-migration-session',
    version: 2,
    slotId: typeof slotId === 'string' ? slotId.trim() : '',
    storageKey: DEFAULT_STORAGE_KEY,
    sourceAccess: false,
    activationEnabled: false,
    authorize(snapshot, phrase, options = {}) {
      const result = authorizeSchema7BrowserMigration(snapshot, phrase, { ...options, meta: options.meta || metadata });
      authorization = result.authorized ? BROWSER_MIGRATION_AUTHORIZATION_PHRASE : null;
      return result;
    },
    async execute(snapshot, options = {}) {
      if (authorization !== BROWSER_MIGRATION_AUTHORIZATION_PHRASE) {
        return Object.freeze({
          kind: 'schema7-browser-migration-session-result',
          version: 2,
          executed: false,
          persisted: false,
          verified: false,
          checkpointCreated: false,
          activationPerformed: false,
          blockers: Object.freeze(['Migration session is not authorized'])
        });
      }

      authorization = null;
      let checkpoint;
      try {
        checkpoint = createBrowserMigrationRecoveryCheckpoint(storage);
      } catch (error) {
        return Object.freeze({
          kind: 'schema7-browser-migration-session-result',
          version: 2,
          executed: false,
          persisted: false,
          verified: false,
          checkpointCreated: false,
          activationPerformed: false,
          blockers: Object.freeze([error && error.message ? error.message : 'Recovery checkpoint creation failed'])
        });
      }

      const persistence = await executeSchema7ControlledBrowserPersistence(
        storage,
        slotId,
        snapshot,
        BROWSER_MIGRATION_AUTHORIZATION_PHRASE,
        { ...options, meta: options.meta || metadata }
      );

      if (!persistence.persisted || !persistence.verified) {
        return Object.freeze({
          kind: 'schema7-browser-migration-session-result',
          version: 2,
          executed: persistence.executed,
          persisted: persistence.persisted,
          verified: false,
          checkpointCreated: checkpoint.verified,
          checkpoint,
          activationPerformed: false,
          blockers: persistence.blockers
        });
      }

      const loaded = loadVerifiedBrowserGameState(storage, slotId);
      return Object.freeze({
        kind: 'schema7-browser-migration-session-result',
        version: 2,
        executed: true,
        persisted: true,
        verified: loaded.verified,
        checkpointCreated: checkpoint.verified,
        checkpoint,
        loadedState: loaded.verified ? loaded.state : null,
        activationPerformed: false,
        blockers: loaded.blockers
      });
    }
  });
}

module.exports = { createSchema7BrowserMigrationSession };
