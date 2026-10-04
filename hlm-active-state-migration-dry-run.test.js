'use strict';
const assert = require('assert');
const { createActiveStateMigrationDryRun } = require('./hlm-active-state-migration-dry-run');

(() => {
  const source = {
    schema: 7,
    settings: { controlledTeamId: 5 },
    contracts: [{ id: 'legacy-contract' }],
    transactions: [],
    draftPicks: []
  };
  const before = JSON.stringify(source);
  const result = createActiveStateMigrationDryRun(source);

  assert.strictEqual(result.ready, true);
  assert.strictEqual(result.backupVerified, true);
  assert.strictEqual(result.dryRunOnly, true);
  assert.strictEqual(result.writeAuthorized, false);
  assert.strictEqual(result.persistenceEnabled, false);
  assert.strictEqual(result.preservesSourceState, true);
  assert.strictEqual(JSON.stringify(source), before);
  assert(result.steps.includes('validate-candidate-before-any-write'));

  const blocked = createActiveStateMigrationDryRun({ schema: 6 });
  assert.strictEqual(blocked.ready, false);
  assert(blocked.blockers.length > 0);

  console.log('Active state migration dry-run tests passed.');
})();
