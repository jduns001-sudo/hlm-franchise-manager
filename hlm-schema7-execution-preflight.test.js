'use strict';
const assert = require('assert');
const { evaluateSchema7ExecutionPreflight } = require('./hlm-schema7-execution-preflight');

(() => {
  const good = evaluateSchema7ExecutionPreflight({
    executable: true,
    target: 'isolated-game-state-save',
    sourceMustBePreserved: true,
    rollbackRequired: true,
    verifyAfterWrite: true,
    deleteSourceAllowed: false,
    candidate: { schema: 7 },
    backup: { format: 'HFM_FRONT_OFFICE_BACKUP' }
  });
  assert.strictEqual(good.ready, true);
  assert.strictEqual(good.sourceMutationAllowed, false);
  assert.strictEqual(good.sourceDeletionAllowed, false);

  const unsafe = evaluateSchema7ExecutionPreflight({
    executable: true,
    target: 'legacy-indexeddb',
    sourceMustBePreserved: false,
    rollbackRequired: false,
    verifyAfterWrite: false,
    deleteSourceAllowed: true
  });
  assert.strictEqual(unsafe.ready, false);
  assert(unsafe.blockers.length >= 6);

  assert.strictEqual(evaluateSchema7ExecutionPreflight(null).ready, false);
  console.log('Schema 7 execution preflight tests passed.');
})();
