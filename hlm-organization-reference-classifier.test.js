'use strict';
const assert = require('node:assert/strict');
const { createOrganizationReferenceClassifier } = require('./hlm-organization-reference-classifier');

const teams = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 1, name: 'Duplicate' }, { id: 100, name: 'Invalid sentinel' }];
const players = [
  { id: 11, teamId: 1 },
  { id: 12, teamId: 3515531 },
  { id: 13, teamId: -1 },
  { id: 14, teamId: 0 },
  { id: 15, teamId: 100 },
  { id: 16, teamId: -8 },
  { id: 17, teamId: '1' },
  { id: 18, teamId: null }
];
const before = JSON.stringify({ teams, players });
const classifier = createOrganizationReferenceClassifier(teams);
const entries = classifier.classifyPlayers(players);
assert.equal(JSON.stringify({ teams, players }), before, 'inputs must remain unchanged');
assert.deepEqual(classifier.knownTeamIds, [1, 2]);
assert(classifier.diagnostics.some(d => d.code === 'DUPLICATE_TEAM_ID'));
assert(classifier.diagnostics.some(d => d.code === 'INVALID_TEAM_ID'));
assert.deepEqual(entries.map(e => e.status), [
  'known-team', 'external-organization-unresolved', 'sentinel-no-team',
  'sentinel-unassigned', 'sentinel-legacy-unknown', 'other-negative-sentinel',
  'invalid-reference', 'invalid-reference'
]);
assert.equal(entries[1].teamId, 3515531);
assert.equal(entries[2].teamId, -1);
assert.equal(entries[3].teamId, 0);
assert.equal(entries[4].teamId, 100);
assert.equal(entries[2].confidence, 'inferred');
assert.equal(entries[4].confidence, 'ambiguous');
assert.equal(entries[2].eligibleFreeAgent, null);
assert.equal(entries[3].eligibleFreeAgent, null);
assert.equal(entries[4].eligibleFreeAgent, null);
assert.equal(classifier.classify(27).status, 'external-organization-unresolved');
assert.equal(classifier.classify(1).confidence, 'confirmed');
assert.equal(classifier.classify(Number.NaN).status, 'invalid-reference');
assert.equal(classifier.classify(1.5).status, 'invalid-reference');
assert.equal(classifier.persistencePerformed, false);
assert.equal(classifier.sourceStateMutated, false);
console.log('Mission 664 organization reference classifier tests passed.');
