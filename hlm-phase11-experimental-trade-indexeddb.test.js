'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_DATABASE_NAME,
  createExperimentalTradeIndexedDbRepository
} = require('./hlm-phase11-experimental-trade-indexeddb');

test('default-off repository refuses operations without opening IndexedDB', async () => {
  let opens = 0;
  const repository = createExperimentalTradeIndexedDbRepository({
    indexedDB: {open() { opens++; throw Error('unexpected open'); }}
  });
  await assert.rejects(repository.readSnapshot('hlm-phase11-isolated-test'), /disabled/);
  await assert.rejects(repository.initializeSnapshot('hlm-phase11-isolated-test', {}, 'r1'), /disabled/);
  assert.equal(opens, 0);
});

test('only the dedicated experimental database and isolated keys are accepted', async () => {
  const indexedDB = {open() { throw Error('not called'); }};
  assert.equal(DEFAULT_DATABASE_NAME.startsWith('hlm-franchise-manager-experimental-trade-'), true);
  assert.throws(() => createExperimentalTradeIndexedDbRepository({
    indexedDB,
    enabled: true,
    databaseName: 'hlm_front_office_v8'
  }), /experimental trade database/);

  const repository = createExperimentalTradeIndexedDbRepository({indexedDB, enabled: true});
  await assert.rejects(repository.readSnapshot('hlm_front_office_v8'), /isolated franchise key/);
});

test('requires a native IndexedDB API', () => {
  assert.throws(() => createExperimentalTradeIndexedDbRepository({indexedDB: null}), /IndexedDB API required/);
});
