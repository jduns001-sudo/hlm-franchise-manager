'use strict';
const assert = require('assert');
const { fingerprint, verifyActiveStateBackupRoundTrip } = require('./hlm-active-state-backup-roundtrip');

(() => {
  const a = { z: 1, a: { y: 2, x: [3, { b: 4, a: 5 }] } };
  const b = { a: { x: [3, { a: 5, b: 4 }], y: 2 }, z: 1 };
  assert.strictEqual(fingerprint(a), fingerprint(b));

  const snapshot = {
    schema: 7,
    settings: { controlledTeamId: 5, season: 2026 },
    contracts: [{ id: 'CON-1', playerId: 10 }],
    transactions: [{ transactionId: 'TXN-1', playerId: 10 }],
    draftPicks: [{ pickId: 'PICK-1', year: 2027, round: 1 }]
  };
  const result = verifyActiveStateBackupRoundTrip(snapshot, { label: 'roundtrip-test' });
  assert.strictEqual(result.validation.valid, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.sourceFingerprint, result.restoredFingerprint);

  snapshot.settings.controlledTeamId = 99;
  assert.strictEqual(result.backup.payload.settings.controlledTeamId, 5);

  console.log('Active state backup round-trip tests passed.');
})();
