'use strict';
const assert = require('assert');
const {
  ACTIVE_STATE_BACKUP_FORMAT,
  createActiveStateBackup,
  validateActiveStateBackup,
  restoreCandidateFromBackup
} = require('./hlm-active-state-backup-contract');

(() => {
  const source = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [{ id: 'CON-1' }] };
  const backup = createActiveStateBackup(source, { createdAt: '2026-10-04T00:00:00Z', label: 'pre-migration' });
  assert.strictEqual(backup.format, ACTIVE_STATE_BACKUP_FORMAT);
  assert.strictEqual(backup.sourceSchema, 7);
  assert.strictEqual(validateActiveStateBackup(backup).valid, true);

  backup.payload.settings.controlledTeamId = 99;
  assert.strictEqual(source.settings.controlledTeamId, 5);

  const restored = restoreCandidateFromBackup(backup);
  restored.settings.controlledTeamId = 12;
  assert.strictEqual(backup.payload.settings.controlledTeamId, 99);

  assert.strictEqual(validateActiveStateBackup({}).valid, false);
  assert.throws(() => restoreCandidateFromBackup({}), e => e && e.code === 'INVALID_ACTIVE_STATE_BACKUP');
  assert.throws(() => createActiveStateBackup(null), /snapshot/);

  console.log('Active state backup contract tests passed.');
})();
