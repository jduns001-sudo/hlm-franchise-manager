'use strict';
const assert = require('assert');
const { evaluateExistingSlotNextEventCalendarReplacementReadiness } = require('./hlm-calendar-next-event-replacement-readiness');

const targetEvent = Object.freeze({ id: 'game-1', type: 'game', date: '2027-03-05', important: true });
const state = Object.freeze({ meta: Object.freeze({ currentDate: '2027-03-05' }) });
const executionVerification = Object.freeze({ targetEvent });
const reload = Object.freeze({
  kind: 'persisted-next-event-calendar-gamestate-reload-verification',
  version: 1, verified: true, slotId: 'staging-next-event',
  fromDate: '2027-03-03', toDate: '2027-03-05',
  targetEvent, verification: executionVerification, state
});
const checkpoint = Object.freeze({
  kind: 'next-event-calendar-persistence-recovery-checkpoint',
  version: 1, verified: true, storageKey: 'hlm-saves',
  slotId: 'active', saveStoreValue: '{"active":{"date":"2027-03-03"}}'
});
const repository = { has: id => id === 'active' || id === 'staging-next-event' };

const readiness = evaluateExistingSlotNextEventCalendarReplacementReadiness({
  reloadVerification: reload, checkpoint, repository,
  targetSlotId: 'active', storageKey: 'hlm-saves'
});
assert.strictEqual(readiness.kind, 'existing-slot-next-event-calendar-replacement-readiness');
assert.strictEqual(readiness.version, 1);
assert.strictEqual(readiness.ready, true);
assert.strictEqual(readiness.replacementAuthorized, false);
assert.strictEqual(readiness.replacementPerformed, false);
assert.strictEqual(readiness.candidateSlotId, 'staging-next-event');
assert.strictEqual(readiness.targetSlotId, 'active');
assert.strictEqual(readiness.targetEvent, targetEvent);
assert.strictEqual(readiness.reloadVerification, reload);
assert.strictEqual(readiness.checkpoint, checkpoint);
assert.strictEqual(readiness.requirements.explicitReplacementAuthorizationRequired, true);
assert.strictEqual(readiness.requirements.verifyAfterReplacementRequired, true);
assert.strictEqual(readiness.requirements.restoreCheckpointOnFailureRequired, true);
assert.strictEqual(Object.isFrozen(readiness), true);
assert.strictEqual(Object.isFrozen(readiness.requirements), true);

assert.throws(() => evaluateExistingSlotNextEventCalendarReplacementReadiness({
  reloadVerification: reload, checkpoint, repository,
  targetSlotId: 'staging-next-event', storageKey: 'hlm-saves'
}), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_NOT_READY');

assert.throws(() => evaluateExistingSlotNextEventCalendarReplacementReadiness({
  reloadVerification: reload, checkpoint, repository: { has: () => false },
  targetSlotId: 'active', storageKey: 'hlm-saves'
}), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_NOT_READY');

assert.throws(() => evaluateExistingSlotNextEventCalendarReplacementReadiness({
  reloadVerification: reload, checkpoint: { ...checkpoint, saveStoreValue: null }, repository,
  targetSlotId: 'active', storageKey: 'hlm-saves'
}), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_NOT_READY');

assert.throws(() => evaluateExistingSlotNextEventCalendarReplacementReadiness({
  reloadVerification: { ...reload, targetEvent: { ...targetEvent } }, checkpoint, repository,
  targetSlotId: 'active', storageKey: 'hlm-saves'
}), e => e.code === 'NEXT_EVENT_CALENDAR_REPLACEMENT_NOT_READY');

console.log('Next-event existing-slot calendar replacement readiness tests passed.');
