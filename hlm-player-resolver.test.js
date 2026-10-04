'use strict';

const assert = require('assert');
const { resolvePlayerRecord } = require('./hlm-player-resolver');

const record = {
  playerId: 7,
  canonical: { id: 7, first: 'Test', last: 'Player', teamId: 10, ovr: 71, potential: 80, type: 'TWF' },
  sources: {
    rosterSnapshots: [
      { sourceIndex: 4, row: { id: 7, ovr: 84, potential: 86, pos: 'C', teamId: -1 } },
      { sourceIndex: 9, row: { id: 7, ovr: 85, potential: 87, pos: 'LW', teamId: -1 } }
    ]
  }
};

const before = JSON.stringify(record);
const a = resolvePlayerRecord(record, {
  playerFix: { position: 'RW', potential: 88 },
  playerOverride: { teamId: 20, ovr: 90, id: 999 }
});

assert.strictEqual(a.player.id, 7, 'permanent Player ID cannot be overridden');
assert.strictEqual(a.player.teamId, 20, 'runtime override wins current team');
assert.strictEqual(a.player.ovr, 90, 'runtime override wins Overall');
assert.strictEqual(a.player.position, 'RW', 'PLAYER_FIXES wins position before runtime override');
assert.strictEqual(a.player.potential, 88, 'PLAYER_FIXES wins potential before runtime override');
assert.strictEqual(a.player.type, 'TWF', 'Universe remains authority for type');
assert.strictEqual(a.provenance.id.source, 'universe');
assert.strictEqual(a.provenance.teamId.source, 'playerOverride');
assert.strictEqual(a.provenance.position.source, 'playerFix');
assert.strictEqual(JSON.stringify(record), before, 'resolver must not mutate registry record');

const b = resolvePlayerRecord(record);
assert.strictEqual(b.player.ovr, 85, 'latest roster snapshot reproduces current last-row Overall behavior');
assert.strictEqual(b.player.potential, 87);
assert.strictEqual(b.player.position, 'LW');
assert.strictEqual(b.player.teamId, 10, 'roster teamId must not replace Universe current assignment');

const zeroOvr = resolvePlayerRecord({
  canonical: { id: 8, ovr: 73, teamId: -1 },
  sources: { rosterSnapshots: [{ sourceIndex: 1, row: { id: 8, ovr: 0 } }] }
});
assert.strictEqual(zeroOvr.player.ovr, 73, 'non-positive roster Overall must not replace Universe fallback');

console.log('Player authority resolver tests passed.');
