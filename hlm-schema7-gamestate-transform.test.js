'use strict';
const assert = require('assert');
const { transformSchema7ToGameState } = require('./hlm-schema7-gamestate-transform');

(() => {
  const source = {
    schema: 7, settings: { controlledTeamId: 12, theme: 'dark' },
    contracts: [{ id: 'c1' }], transactions: [{ transactionId: 't1' }],
    draftPicks: [{ pickId: 'p1' }], prospects: [{ id: 'x1' }],
    history: [{ season: 2026 }], lines: { NHL: ['a'] }, depth: { C: ['a'] },
    draftBoard: ['x1'], waivers: ['w1'], notes: { x: 'keep' }
  };
  const original = JSON.stringify(source);
  const result = transformSchema7ToGameState(source);
  assert.strictEqual(result.validation.valid, true);
  assert.strictEqual(result.state.schemaVersion, 1);
  assert.strictEqual(result.state.meta.controlledTeamId, 12);
  assert.deepStrictEqual(result.state.assets.contracts, source.contracts);
  assert.deepStrictEqual(result.state.assets.draftPicks, source.draftPicks);
  assert.deepStrictEqual(result.state.activity.transactions, source.transactions);
  assert.deepStrictEqual(result.state.universe.prospects, source.prospects);
  assert.deepStrictEqual(result.state.history.records, source.history);
  assert.deepStrictEqual(result.state.extensions.frontOfficeSchema7, source);
  assert.strictEqual(result.sourcePreserved, true);
  assert.strictEqual(JSON.stringify(source), original);
  assert.throws(() => transformSchema7ToGameState({ schema: 6 }), /schema 7/i);
  console.log('Schema 7 to GameState transform tests passed.');
})();
