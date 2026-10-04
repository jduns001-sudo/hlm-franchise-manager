'use strict';
const assert = require('assert');
const { evaluateSchema7CandidateReadiness } = require('./hlm-schema7-candidate-readiness');

(() => {
  const state = {
    schema: 7,
    settings: { controlledTeamId: 5 },
    contracts: [{ id: 'CON-1' }],
    transactions: [{ transactionId: 'TXN-1' }],
    draftPicks: [{ pickId: 'PICK-1' }]
  };
  const ready = evaluateSchema7CandidateReadiness(state);
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.backupVerified, true);
  assert.strictEqual(ready.candidateValid, true);
  assert.strictEqual(ready.writeAuthorized, false);
  assert.strictEqual(ready.persistenceEnabled, false);
  assert(ready.candidate);
  assert(ready.backup);

  const duplicate = evaluateSchema7CandidateReadiness({
    schema: 7,
    settings: {},
    contracts: [{ id: 'CON-X' }, { id: 'CON-X' }]
  });
  assert.strictEqual(duplicate.ready, false);
  assert.strictEqual(duplicate.candidateValid, false);
  assert.strictEqual(duplicate.candidate, null);

  console.log('Schema 7 candidate readiness tests passed.');
})();
