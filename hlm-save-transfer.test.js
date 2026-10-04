'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { exportGameState, inspectGameStateImport, importGameState } = require('./hlm-save-transfer');

const state = createGameStateEnvelope({
  meta: { saveId: 'SAVE-export', controlledTeamId: 5, currentDate: '2026-07-01' },
  players: [{ id: 1, name: 'Player' }],
  teams: [{ id: 5, name: 'Team' }]
});
const before = JSON.stringify(state);
const text = exportGameState(state, {
  label: 'Export Test',
  exportedAt: '2026-10-04T00:00:00Z'
});

const inspection = inspectGameStateImport(text);
assert.strictEqual(inspection.valid, true);
assert.strictEqual(inspection.metadata.label, 'Export Test');
assert.deepStrictEqual(inspection.state, state);
assert.deepStrictEqual(importGameState(text).state, state);
assert.strictEqual(JSON.stringify(state), before);

assert.strictEqual(inspectGameStateImport('').error.code, 'INVALID_IMPORT_TEXT');
assert.strictEqual(inspectGameStateImport('not-json').error.code, 'INVALID_IMPORT_JSON');

const unsupported = JSON.parse(text);
unsupported.formatVersion = 999;
assert.strictEqual(inspectGameStateImport(JSON.stringify(unsupported)).error.code, 'UNSUPPORTED_EXPORT_FORMAT');

const tampered = JSON.parse(text);
tampered.save.payload = tampered.save.payload.replace('Player', 'Changed');
assert.strictEqual(inspectGameStateImport(JSON.stringify(tampered)).error.code, 'SAVE_INTEGRITY_MISMATCH');
assert.throws(() => importGameState(JSON.stringify(tampered)), err => err.code === 'SAVE_INTEGRITY_MISMATCH');

console.log('Save transfer tests passed.');
