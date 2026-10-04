'use strict';
const assert = require('assert');
const { migrateOperationalDraftPickIdentities } = require('./hlm-draft-pick-identity-migration');

const source = [
  { year: 2027, round: 1, originalTeamId: 5, ownerTeamId: 6 },
  { year: 2027, round: 1, originalTeamId: 5, ownerTeamId: 7 }
];
const before = JSON.stringify(source);
const first = migrateOperationalDraftPickIdentities(source);
assert.strictEqual(first.changed, 2);
assert(first.picks.every(p => /^PICK-/.test(p.pickId)));
assert.notStrictEqual(first.picks[0].pickId, first.picks[1].pickId);
assert.strictEqual(JSON.stringify(source), before);
const second = migrateOperationalDraftPickIdentities(first.picks);
assert.strictEqual(second.changed, 0);
assert.deepStrictEqual(second.picks, first.picks);
const repeat = migrateOperationalDraftPickIdentities(source);
assert.deepStrictEqual(repeat.picks, first.picks);
console.log('Operational DraftPick identity migration tests passed.');
