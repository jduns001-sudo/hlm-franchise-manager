'use strict';
const assert = require('assert');
const { prepareSchema7MigrationCandidate } = require('./hlm-schema7-migration-candidate');

(() => {
  const source = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [], transactions: [], draftPicks: [] };
  const before = JSON.stringify(source);
  const result = prepareSchema7MigrationCandidate(source);
  assert.strictEqual(result.ready, true);
  assert.strictEqual(result.writeAuthorized, false);
  assert.strictEqual(result.persistenceEnabled, false);
  assert.notStrictEqual(result.candidate, source);
  result.candidate.settings.controlledTeamId = 99;
  assert.strictEqual(source.settings.controlledTeamId, 5);
  assert.strictEqual(JSON.stringify(source), before);

  const blocked = prepareSchema7MigrationCandidate({ schema: 6 });
  assert.strictEqual(blocked.ready, false);
  assert.strictEqual(blocked.candidate, null);
  console.log('Schema 7 migration candidate tests passed.');
})();
