'use strict';
const assert = require('assert');
const {
  createNextEventCalendarPersistenceRecoveryCheckpoint,
  restoreNextEventCalendarPersistenceRecoveryCheckpoint
} = require('./hlm-calendar-next-event-persistence-recovery-checkpoint');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    values
  };
}

const storage = memoryStorage({ 'hlm-saves': '{"active":{"date":"2027-03-03"}}' });
const checkpoint = createNextEventCalendarPersistenceRecoveryCheckpoint({
  storage, storageKey: 'hlm-saves', slotId: 'active'
});
assert.strictEqual(checkpoint.kind, 'next-event-calendar-persistence-recovery-checkpoint');
assert.strictEqual(checkpoint.version, 1);
assert.strictEqual(checkpoint.verified, true);
assert.strictEqual(checkpoint.storageKey, 'hlm-saves');
assert.strictEqual(checkpoint.slotId, 'active');
assert.strictEqual(checkpoint.saveStoreValue, '{"active":{"date":"2027-03-03"}}');
assert.strictEqual(Object.isFrozen(checkpoint), true);

storage.setItem('hlm-saves', '{"changed":true}');
const restoration = restoreNextEventCalendarPersistenceRecoveryCheckpoint({ storage, checkpoint });
assert.strictEqual(restoration.kind, 'next-event-calendar-persistence-recovery-restoration');
assert.strictEqual(restoration.restored, true);
assert.strictEqual(restoration.checkpoint, checkpoint);
assert.strictEqual(storage.getItem('hlm-saves'), checkpoint.saveStoreValue);
assert.strictEqual(Object.isFrozen(restoration), true);

const emptyStorage = memoryStorage();
const emptyCheckpoint = createNextEventCalendarPersistenceRecoveryCheckpoint({
  storage: emptyStorage, storageKey: 'hlm-saves', slotId: 'active'
});
assert.strictEqual(emptyCheckpoint.saveStoreValue, null);
emptyStorage.setItem('hlm-saves', 'temporary');
restoreNextEventCalendarPersistenceRecoveryCheckpoint({ storage: emptyStorage, checkpoint: emptyCheckpoint });
assert.strictEqual(emptyStorage.getItem('hlm-saves'), null);

assert.throws(() => createNextEventCalendarPersistenceRecoveryCheckpoint({
  storage: {}, storageKey: 'hlm-saves', slotId: 'active'
}), e => e.code === 'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT');
assert.throws(() => createNextEventCalendarPersistenceRecoveryCheckpoint({
  storage: memoryStorage(), storageKey: '', slotId: 'active'
}), e => e.code === 'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT');
assert.throws(() => restoreNextEventCalendarPersistenceRecoveryCheckpoint({
  storage: memoryStorage(), checkpoint: { ...checkpoint, verified: false }
}), e => e.code === 'INVALID_NEXT_EVENT_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT');

console.log('Next-event calendar persistence recovery checkpoint tests passed.');
