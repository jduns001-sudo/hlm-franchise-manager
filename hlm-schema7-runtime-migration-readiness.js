'use strict';

const { evaluateFrontOfficeRuntimeReadiness } = require('./hlm-front-office-readiness-gate');
const { createSchema7MigrationPlan } = require('./hlm-schema7-migration-plan');

function evaluateSchema7RuntimeMigrationReadiness(snapshot, options = {}) {
  const runtime = evaluateFrontOfficeRuntimeReadiness(snapshot);
  const plan = createSchema7MigrationPlan(snapshot, options);
  const blockers = [];

  if (!runtime.ready) blockers.push(...runtime.blockers.map(value => 'RUNTIME: ' + value));
  if (!plan.readyForAuthorization) blockers.push(...plan.blockers.map(value => 'MIGRATION: ' + value));

  return Object.freeze({
    kind: 'schema7-runtime-migration-readiness',
    version: 1,
    ready: blockers.length === 0,
    blockers: Object.freeze(blockers),
    runtime,
    plan,
    readOnly: true,
    writeAuthorized: false,
    persistenceEnabled: false,
    sourceMutationAllowed: false,
    sourceDeletionAllowed: false,
    target: 'isolated-game-state-save'
  });
}

module.exports = { evaluateSchema7RuntimeMigrationReadiness };
