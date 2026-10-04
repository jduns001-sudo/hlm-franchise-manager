'use strict';
const assert = require('assert');
const { createSchema7GameStateRepositoryBridge } = require('./hlm-schema7-gamestate-repository-bridge');

(async () => {
  const slots = new Map();
  const repository = {
    async save(id, state) { if (slots.has(id)) throw new Error('slot exists'); slots.set(id, { state: JSON.parse(JSON.stringify(state)) }); },
    async load(id) { return slots.get(id) || null; },
    async remove(id) { slots.delete(id); }
  };
  const bridge = createSchema7GameStateRepositoryBridge(repository, 'migration-preview');
  const pkg = {
    executable: true, target: 'isolated-game-state-save', sourceMustBePreserved: true,
    rollbackRequired: true, verifyAfterWrite: true, deleteSourceAllowed: false,
    candidate: { schema: 7, settings: { controlledTeamId: 5 } }, backup: { ok: true }
  };
  const result = await bridge.execute(pkg);
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.verified, true);
  assert(slots.has('migration-preview'));

  assert.throws(() => createSchema7GameStateRepositoryBridge({}, 'x'), /repository/);
  assert.throws(() => createSchema7GameStateRepositoryBridge(repository, ''), /slotId/);
  console.log('Schema 7 GameState repository bridge tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
