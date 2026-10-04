'use strict';
const assert = require('assert');
const { evaluateSchema7CandidateReadiness } = require('./hlm-schema7-candidate-readiness');

(() => {
  const source = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [] };
  const ready = evaluateSchema7CandidateReadiness(source);
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.backupVerified, true);
  assert.strictEqual(ready.candidateValidated, true);
  assert.strictEqual(ready.writeAuthorized, false);
  assert.strictEqual(ready.persistenceEnabled, false);
  assert(ready.candidate);
  assert(ready.backup);

  const duplicate = evaluateSchema7CandidateReadiness({
    schema: 7,
    settings: {},
    contracts: [{ id: 'CON-X' }, { id: 'CON-X' }],
    transactions: [],
    draftPicks: []
  });
  assert.strictEqual(duplicate.ready, false);
  assert.strictEqual(duplicate.candidate, null);
  assert(duplicate.blockers.some(x => x.includes('Duplicate contract IDs')));

  console.log('Schema 7 candidate readiness tests passed.');
})();
