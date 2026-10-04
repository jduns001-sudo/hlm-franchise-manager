'use strict';
const assert = require('assert');
const { pickNaturalKey, auditDraftPickIdentity, draftPickReference } = require('./hlm-draft-pick-identity');

const picks = [
  { leagueId: 1, year: 2027, originalTeamId: 10, ownerTeamId: 20, round: 1 },
  { leagueId: 1, year: 2027, originalTeamId: 10, ownerTeamId: 30, round: 1 },
  { leagueId: 1, year: 2027, originalTeamId: 11, ownerTeamId: 11, round: 2, pickId: 'legacy-x' }
];
const before = JSON.stringify(picks);
const audit = auditDraftPickIdentity(picks);

assert.strictEqual(pickNaturalKey(picks[0]), '1|2027|10|1');
assert.strictEqual(audit.total, 3);
assert.strictEqual(audit.withoutExistingId, 2);
assert.strictEqual(audit.repeatedNaturalKeys.length, 1);
assert.strictEqual(audit.repeatedNaturalKeys[0].count, 2);
assert.strictEqual(audit.permanentIdentityReady, false);
assert.strictEqual(draftPickReference(picks[0], 0).currentOwnerTeamId, 20);
assert.strictEqual(JSON.stringify(picks), before, 'DraftPick audit must be read-only');

console.log('DraftPick identity audit tests passed.');
