'use strict';

const { AUTHORIZATION_PHRASE } = require('./hlm-schema7-migration-authorization');
const { createSchema7BrowserGameStateBridge } = require('./hlm-schema7-browser-gamestate-bridge');

function createSchema7BrowserMigrationSession(storage, slotId, metadata = {}) {
  const bridge = createSchema7BrowserGameStateBridge(storage, slotId, metadata);
  let authorized = false;

  return Object.freeze({
    kind: 'schema7-browser-migration-session',
    version: 1,
    slotId: bridge.slotId,
    storageKey: bridge.storageKey,
    sourceAccess: false,
    authorize(phrase) {
      authorized = phrase === AUTHORIZATION_PHRASE;
      return authorized;
    },
    async execute(snapshot, options = {}) {
      if (!authorized) {
        return Object.freeze({
          executed: false,
          verified: false,
          transformed: false,
          gameStateValid: false,
          blockers: Object.freeze(['Migration session is not authorized'])
        });
      }
      authorized = false;
      return bridge.migrate(snapshot, AUTHORIZATION_PHRASE, options);
    }
  });
}

module.exports = { createSchema7BrowserMigrationSession };
