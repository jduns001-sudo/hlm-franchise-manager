'use strict';
const assert = require('assert');
const { evaluateActiveStateBackupReadiness } = require('./hlm-active-state-backup-readiness');

(() => {
  const state = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [] };
  const ready = evaluateActiveStateBackupReadiness(state, { label: 'pre-migration' });
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.backupVerified, true);
  assert.strictEqual(ready.writeAuthorized, false);
  assert.strictEqual(ready.persistenceEnabled, false);
  assert(ready.backup);

  const wrongSchema = evaluateActiveStateBackupReadiness({ schema: 6 });
  assert.strictEqual(wrongSchema.ready, false);
  assert(wrongSchema.blockers.some(x => x.includes('schema 7')));

  assert.strictEqual(evaluateActiveStateBackupReadiness(null).ready, false);
  console.log('Active state backup readiness tests passed.');
})();
