'use strict';
const assert = require('assert');
const { createActiveStateMigrationCandidate } = require('./hlm-active-state-migration-candidate');

(() => {
  const source = {
    schema: 7,
    settings: { controlledTeamId: 5 },
    contracts: [{ id: 'CON-1' }],
    transactions: [],
    draftPicks: []
  };
  const result = createActiveStateMigrationCandidate(source, { label: 'candidate-test' });
  assert.strictEqual(result.sourceSchema, 7);
  assert.strictEqual(result.targetSchema, null);
  assert.strictEqual(result.backupVerified, true);
  assert.strictEqual(result.migrationApplied, false);
  assert.strictEqual(result.writeAuthorized, false);
  assert.strictEqual(result.persistenceEnabled, false);
  assert.deepStrictEqual(result.candidate, source);

  result.candidate.settings.controlledTeamId = 99;
  assert.strictEqual(source.settings.controlledTeamId, 5);
  assert.strictEqual(result.backup.payload.settings.controlledTeamId, 5);

  assert.throws(
    () => createActiveStateMigrationCandidate({ schema: 6 }),
    error => error && error.code === 'ACTIVE_STATE_BACKUP_NOT_READY'
  );

  console.log('Active state migration candidate tests passed.');
})();
