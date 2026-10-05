'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY } = require('./hlm-browser-save-adapter');
const {
  createCalendarPersistenceRecoveryCheckpoint,
  restoreCalendarPersistenceRecoveryCheckpoint
} = require('./hlm-calendar-persistence-recovery-checkpoint');

function storage(seed = {}) {
  const data = { ...seed };
  return {
    getItem: key => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null,
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; }
  };
}

const originalStore = JSON.stringify({
  franchise: 'serialized-old-state',
  unrelated: 'preserve-this-too'
});
const s = storage({ [DEFAULT_STORAGE_KEY]: originalStore, other_key: 'untouched' });

const checkpoint = createCalendarPersistenceRecoveryCheckpoint({
  storage: s,
  storageKey: DEFAULT_STORAGE_KEY,
  slotId: 'franchise'
});
assert.strictEqual(checkpoint.kind, 'calendar-persistence-recovery-checkpoint');
assert.strictEqual(checkpoint.version, 1);
assert.strictEqual(checkpoint.verified, true);
assert.strictEqual(checkpoint.storageKey, DEFAULT_STORAGE_KEY);
assert.strictEqual(checkpoint.slotId, 'franchise');
assert.strictEqual(checkpoint.saveStoreValue, originalStore);
assert.strictEqual(Object.isFrozen(checkpoint), true);

s.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ franchise: 'replacement' }));
const restoration = restoreCalendarPersistenceRecoveryCheckpoint({ storage: s, checkpoint });
assert.strictEqual(restoration.restored, true);
assert.strictEqual(restoration.storageKey, DEFAULT_STORAGE_KEY);
assert.strictEqual(restoration.slotId, 'franchise');
assert.strictEqual(restoration.checkpoint, checkpoint);
assert.strictEqual(s.getItem(DEFAULT_STORAGE_KEY), originalStore);
assert.strictEqual(s.getItem('other_key'), 'untouched');
assert.strictEqual(Object.isFrozen(restoration), true);

const empty = storage();
const emptyCheckpoint = createCalendarPersistenceRecoveryCheckpoint({
  storage: empty, storageKey: DEFAULT_STORAGE_KEY, slotId: 'new-slot'
});
assert.strictEqual(emptyCheckpoint.saveStoreValue, null);
empty.setItem(DEFAULT_STORAGE_KEY, '{}');
restoreCalendarPersistenceRecoveryCheckpoint({ storage: empty, checkpoint: emptyCheckpoint });
assert.strictEqual(empty.getItem(DEFAULT_STORAGE_KEY), null);

assert.throws(
  () => createCalendarPersistenceRecoveryCheckpoint({ storage: s, storageKey: '', slotId: 'franchise' }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT'
);
assert.throws(
  () => restoreCalendarPersistenceRecoveryCheckpoint({
    storage: s,
    checkpoint: { ...checkpoint, verified: false }
  }),
  error => error.code === 'INVALID_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT'
);

console.log('Calendar persistence recovery checkpoint tests passed.');
