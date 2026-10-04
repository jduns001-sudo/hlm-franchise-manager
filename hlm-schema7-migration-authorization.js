'use strict';

const { createSchema7MigrationPlan } = require('./hlm-schema7-migration-plan');

const AUTHORIZATION_PHRASE = 'AUTHORIZE_SCHEMA7_ISOLATED_MIGRATION';

function authorizeSchema7Migration(snapshot, authorization, options = {}) {
  const plan = createSchema7MigrationPlan(snapshot, options);
  const authorized = plan.readyForAuthorization === true &&
    authorization === AUTHORIZATION_PHRASE;

  return Object.freeze({
    kind: 'schema7-migration-authorization',
    version: 1,
    ready: plan.readyForAuthorization,
    authorized,
    executionAllowed: authorized,
    writeAuthorized: authorized,
    persistenceEnabled: authorized,
    target: plan.target,
    sourceMustBePreserved: true,
    rollbackRequired: true,
    blockers: plan.blockers,
    warnings: plan.warnings,
    candidate: authorized ? plan.candidate : null,
    backup: plan.backup
  });
}

module.exports = { AUTHORIZATION_PHRASE, authorizeSchema7Migration };
