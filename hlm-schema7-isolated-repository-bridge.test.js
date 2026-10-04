'use strict';
const assert = require('assert');
const { createSchema7IsolatedRepositoryBridge } = require('./hlm-schema7-isolated-repository-bridge');

(async () => {
  const slots = {};
  const repo = {
    save(id, state) { slots[id] = { state: JSON.parse(JSON.stringify(state)) }; },
    load(id) { if (!slots[id]) throw new Error('missing'); return JSON.parse(JSON.stringify(slots[id])); },
    remove(id) { delete slots[id]; },
    has(id) { return Boolean(slots[id]); }
  };
  const bridge = createSchema7IsolatedRepositoryBridge(repo, 'migration-test');
  assert.strictEqual(bridge.sourceAccess, false);
  const pkg = {
    executable: true, target: 'isolated-game-state-save', sourceMustBePreserved: true,
    rollbackRequired: true, verifyAfterWrite: true, deleteSourceAllowed: false,
    candidate: { schema: 7, settings: { controlledTeamId: 5 } }, backup: { ok: true }
  };
  const result = await bridge.execute(pkg);
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert.deepStrictEqual(slots['migration-test'].state, pkg.candidate);
  console.log('Schema 7 isolated repository bridge tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
