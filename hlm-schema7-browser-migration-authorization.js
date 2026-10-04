'use strict';

const { evaluateSchema7BrowserMigrationReadiness } = require('./hlm-schema7-browser-migration-readiness');

const BROWSER_MIGRATION_AUTHORIZATION_PHRASE = 'AUTHORIZE_SCHEMA7_BROWSER_MIGRATION';

function authorizeSchema7BrowserMigration(snapshot, authorization, options = {}) {
  const readiness = evaluateSchema7BrowserMigrationReadiness(snapshot, options);
  const authorizationRequested = authorization === BROWSER_MIGRATION_AUTHORIZATION_PHRASE;
  const authorized = readiness.ready === true && authorizationRequested;

  const blockers = readiness.blockers.slice();
  if (readiness.ready && !authorizationRequested) {
    blockers.push('Explicit browser migration authorization required');
  }

  return Object.freeze({
    kind: 'schema7-browser-migration-authorization',
    version: 1,
    ready: readiness.ready,
    authorizationRequested,
    authorized,
    executionAllowed: authorized,
    writeAuthorized: authorized,
    persistenceEnabled: false,
    sourceSchema: readiness.sourceSchema,
    targetSchemaVersion: readiness.targetSchemaVersion,
    sourcePreserved: readiness.sourcePreserved,
    roundTripVerified: readiness.roundTripVerified,
    sourceMutationAllowed: false,
    sourceDeletionAllowed: false,
    blockers: Object.freeze(blockers)
  });
}

module.exports = {
  BROWSER_MIGRATION_AUTHORIZATION_PHRASE,
  authorizeSchema7BrowserMigration
};
