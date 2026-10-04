'use strict';
const assert = require('assert');
const { validateSchema7MigrationCandidate } = require('./hlm-schema7-candidate-validator');

(() => {
  const valid = validateSchema7MigrationCandidate({
    schema: 7,
    settings: { controlledTeamId: 5 },
    contracts: [{ id: 'CON-1' }],
    transactions: [{ transactionId: 'TXN-1' }],
    draftPicks: [{ pickId: 'PICK-1' }]
  });
  assert.strictEqual(valid.valid, true);
  assert.strictEqual(valid.writeAuthorized, false);
  assert.strictEqual(valid.persistenceEnabled, false);

  const dupes = validateSchema7MigrationCandidate({
    schema: 7,
    contracts: [{ id: 'CON-1' }, { id: 'CON-1' }],
    transactions: [{ transactionId: 'TXN-1' }, { transactionId: 'TXN-1' }],
    draftPicks: [{ pickId: 'PICK-1' }, { pickId: 'PICK-1' }]
  });
  assert.strictEqual(dupes.valid, false);
  assert(dupes.blockers.some(x => x.includes('Duplicate contract IDs')));
  assert(dupes.blockers.some(x => x.includes('Duplicate transaction IDs')));
  assert(dupes.blockers.some(x => x.includes('Duplicate draft-pick IDs')));

  assert.strictEqual(validateSchema7MigrationCandidate({ schema: 6 }).valid, false);
  console.log('Schema 7 migration candidate validator tests passed.');
})();
