'use strict';

const assert = require('assert');
const {
  buildCanonicalPlayerRegistry,
  registrySummary
} = require('./hlm-canonical-data');

const universe = {
  players: [
    { id: 1, first: 'A', last: 'One', teamId: 10 },
    { id: 2, first: 'B', last: 'Two', teamId: 20 }
  ]
};

const roster = {
  players: [
    { id: 1, ovr: 80, teamId: 10, pos: 'C' },
    { id: 1, ovr: 82, teamId: -1, pos: 'C' },
    { id: 2, ovr: 75, teamId: 20, pos: 'D' }
  ]
};

const registry = buildCanonicalPlayerRegistry(universe, roster);
const summary = registrySummary(registry);

assert.strictEqual(registry.playersById.size, 2);
assert.strictEqual(registry.playersById.get(1).sources.rosterSnapshots.length, 2);
assert.deepStrictEqual(registry.playersById.get(1).conflicts.ovr, ['80', '82']);
assert.deepStrictEqual(registry.playersById.get(1).conflicts.teamId, ['10', '-1']);
assert.strictEqual(registry.playersById.get(1).canonical.ovr, undefined, 'roster data must not mutate canonical Universe object');
assert.strictEqual(summary.duplicateRosterIds, 1);
assert.strictEqual(summary.duplicateRosterPlayersWithConflicts, 1);
assert.strictEqual(summary.rosterIdsMissingUniverse, 0);

const missing = buildCanonicalPlayerRegistry(universe, { players: [{ id: 999, ovr: 70 }] });
assert.deepStrictEqual(missing.diagnostics.rosterIdsMissingUniverse, [999]);
assert.strictEqual(missing.playersById.has(999), false, 'missing Universe IDs must not be auto-created');

console.log('Canonical player registry tests passed.');
