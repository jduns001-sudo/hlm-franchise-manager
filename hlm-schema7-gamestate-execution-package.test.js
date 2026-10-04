'use strict';
const assert = require('assert');
const { AUTHORIZATION_PHRASE } = require('./hlm-schema7-migration-authorization');
const { createSchema7GameStateExecutionPackage } = require('./hlm-schema7-gamestate-execution-package');

(() => {
  const source = {
    schema: 7, settings: { controlledTeamId: 12 },
    contracts: [{ id: 'c1' }], transactions: [{ transactionId: 't1' }],
    draftPicks: [{ pickId: 'p1' }], prospects: [], history: [],
    lines: { NHL: ['p10'] }, depth: { C: ['p10'] }, notes: { keep: true }
  };
  const denied = createSchema7GameStateExecutionPackage(source, 'wrong');
  assert.strictEqual(denied.executable, false);
  assert.strictEqual(denied.candidate, null);

  const allowed = createSchema7GameStateExecutionPackage(source, AUTHORIZATION_PHRASE);
  assert.strictEqual(allowed.executable, true);
  assert.strictEqual(allowed.transformed, true);
  assert.strictEqual(allowed.gameStateValid, true);
  assert.strictEqual(allowed.candidate.schemaVersion, 1);
  assert.deepStrictEqual(allowed.candidate.extensions.frontOfficeSchema7, source);
  assert.strictEqual(allowed.candidate.meta.controlledTeamId, 12);
  console.log('Schema 7 GameState execution package tests passed.');
})();
