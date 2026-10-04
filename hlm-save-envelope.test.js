'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createSaveEnvelope, serializeSaveEnvelope, loadSaveEnvelope, hashText } = require('./hlm-save-envelope');

const state = createGameStateEnvelope({
  meta: { saveId: 'SAVE-one', controlledTeamId: 5, currentDate: '2026-07-01' },
  players: [{ id: 1, name: 'Player' }],
  teams: [{ id: 5, name: 'Team' }]
});
const before = JSON.stringify(state);
const envelope = createSaveEnvelope(state, {
  label: 'Test Franchise',
  createdAt: '2026-10-04T00:00:00Z',
  updatedAt: '2026-10-04T00:00:00Z'
});
const text = serializeSaveEnvelope(envelope);
const loaded = loadSaveEnvelope(text);

assert.deepStrictEqual(loaded.state, state);
assert.strictEqual(loaded.envelope.metadata.saveId, 'SAVE-one');
assert.strictEqual(loaded.envelope.metadata.controlledTeamId, 5);
assert.strictEqual(loaded.envelope.metadata.gameDate, '2026-07-01');
assert.strictEqual(loaded.envelope.integrity.payloadHash, hashText(loaded.envelope.payload));
assert.strictEqual(JSON.stringify(state), before);

const tampered = JSON.parse(text);
tampered.payload = tampered.payload.replace('Player', 'Changed');
assert.throws(() => loadSaveEnvelope(JSON.stringify(tampered)), err => err.code === 'SAVE_INTEGRITY_MISMATCH');

const wrongFormat = JSON.parse(text);
wrongFormat.formatVersion = 999;
assert.throws(() => loadSaveEnvelope(JSON.stringify(wrongFormat)), err => err.code === 'UNSUPPORTED_SAVE_FORMAT');

console.log('Save envelope tests passed.');
