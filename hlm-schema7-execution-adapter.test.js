'use strict';
const assert = require('assert');
const { createSchema7ExecutionAdapter } = require('./hlm-schema7-execution-adapter');

(async () => {
  let stored = null;
  let removed = false;
  const adapter = createSchema7ExecutionAdapter({
    writeIsolatedState: async value => { stored = JSON.parse(JSON.stringify(value)); },
    readIsolatedState: async () => JSON.parse(JSON.stringify(stored)),
    removeIsolatedState: async () => { removed = true; stored = null; }
  });
  const pkg = {
    executable: true, target: 'isolated-game-state-save', sourceMustBePreserved: true,
    rollbackRequired: true, verifyAfterWrite: true, deleteSourceAllowed: false,
    candidate: { schema: 7, settings: { controlledTeamId: 5 } }, backup: { ok: true }
  };
  const ok = await adapter.execute(pkg);
  assert.strictEqual(ok.executed, true);
  assert.strictEqual(ok.verified, true);
  assert.strictEqual(removed, false);

  const bad = createSchema7ExecutionAdapter({
    writeIsolatedState: async () => {},
    readIsolatedState: async () => ({ schema: 7, wrong: true }),
    removeIsolatedState: async () => { removed = true; }
  });
  removed = false;
  const failed = await bad.execute(pkg);
  assert.strictEqual(failed.executed, false);
  assert.strictEqual(failed.rolledBack, true);
  assert.strictEqual(removed, true);

  console.log('Schema 7 execution adapter tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
