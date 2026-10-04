'use strict';

const assert = require('assert');
const {
  buildCanonicalPlayerSnapshot,
  validateCanonicalPlayerSnapshot
} = require('./hlm-canonical-player-snapshot');

const universe = {
  players: [
    { id: 1, first: 'A', last: 'One', teamId: 10, ovr: 70, potential: 78 },
    { id: 2, first: 'B', last: 'Two', teamId: -1, ovr: 68, potential: 75 }
  ]
};
const roster = {
  players: [
    { id: 1, ovr: 81, potential: 84, pos: 'C', teamId: -1 },
    { id: 1, ovr: 82, potential: 85, pos: 'LW', teamId: -1 },
    { id: 2, ovr: 72, potential: 80, pos: 'D', teamId: -1 }
  ]
};

const beforeUniverse = JSON.stringify(universe);
const beforeRoster = JSON.stringify(roster);
const snapshot = buildCanonicalPlayerSnapshot(universe, roster, {
  playerFixes: { 1: { position: 'RW', potential: 86 } },
  playerOverrides: { 2: { teamId: 20, ovr: 76 } }
});

assert.strictEqual(snapshot.players.length, 2);
assert.strictEqual(snapshot.playersById.size, 2);
assert.strictEqual(snapshot.playersById.get(1).id, 1);
assert.strictEqual(snapshot.playersById.get(1).ovr, 82);
assert.strictEqual(snapshot.playersById.get(1).position, 'RW');
assert.strictEqual(snapshot.playersById.get(1).teamId, 10, 'roster team assignment must not replace Universe assignment');
assert.strictEqual(snapshot.playersById.get(2).teamId, 20);
assert.strictEqual(snapshot.playersById.get(2).ovr, 76);
assert.strictEqual(snapshot.provenanceByPlayerId.get(2).teamId.source, 'playerOverride');
assert.strictEqual(snapshot.summary.duplicateRosterIds, 1);
assert.strictEqual(JSON.stringify(universe), beforeUniverse, 'Universe input must remain unchanged');
assert.strictEqual(JSON.stringify(roster), beforeRoster, 'roster input must remain unchanged');
assert.deepStrictEqual(validateCanonicalPlayerSnapshot(snapshot), { valid: true, errors: [] });

const broken = {
  players: [{ id: 1 }, { id: 1 }],
  playersById: new Map([[1, { id: 1 }]])
};
const validation = validateCanonicalPlayerSnapshot(broken);
assert.strictEqual(validation.valid, false);
assert.strictEqual(validation.errors[0].code, 'DUPLICATE_PLAYER_ID');

console.log('Canonical player snapshot tests passed.');
