'use strict';
const assert = require('assert');
const { createSchema7MigrationPlan } = require('./hlm-schema7-migration-plan');

(() => {
  const state = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [] };
  const plan = createSchema7MigrationPlan(state);
  assert.strictEqual(plan.readyForAuthorization, true);
  assert.strictEqual(plan.executionAllowed, false);
  assert.strictEqual(plan.writeAuthorized, false);
  assert.strictEqual(plan.persistenceEnabled, false);
  assert.strictEqual(plan.sourceMustBePreserved, true);
  assert.strictEqual(plan.rollbackRequired, true);
  assert.strictEqual(plan.target, 'isolated-game-state-save');
  assert(plan.steps.includes('require-explicit-write-authorization'));
  assert(plan.steps.includes('rollback-on-verification-failure'));

  const blocked = createSchema7MigrationPlan({ schema: 6 });
  assert.strictEqual(blocked.readyForAuthorization, false);
  assert.strictEqual(blocked.candidate, null);

  console.log('Schema 7 migration plan tests passed.');
})();
