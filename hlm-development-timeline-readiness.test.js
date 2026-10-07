'use strict';

const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createDevelopmentTimelineReadiness } = require('./hlm-development-timeline-readiness');

const state = createGameStateEnvelope({
  meta: { currentDate: '2027-04-18' },
  players: [{ id: 101, name: 'Timeline Prospect' }]
});

const notScheduled = createDevelopmentTimelineReadiness({ state });
assert.strictEqual(notScheduled.ready, false);
assert.strictEqual(notScheduled.cadence, null);
assert.strictEqual(notScheduled.universeSystemsProcessed, false);
assert.strictEqual(notScheduled.persistencePerformed, false);
assert.strictEqual(notScheduled.state, state);

const monthlyDue = createDevelopmentTimelineReadiness({ state, cadence: 'monthly', due: true });
assert.strictEqual(monthlyDue.ready, true);
assert.strictEqual(monthlyDue.currentDate, '2027-04-18');
assert.strictEqual(monthlyDue.cadence, 'monthly');
assert.strictEqual(monthlyDue.due, true);

const monthlyNotDue = createDevelopmentTimelineReadiness({ state, cadence: 'monthly', due: false });
assert.strictEqual(monthlyNotDue.ready, false);

assert.throws(
  () => createDevelopmentTimelineReadiness({ state, currentDate: '2027-04-19', cadence: 'monthly', due: true }),
  error => error.code === 'INVALID_DEVELOPMENT_TIMELINE_READINESS'
);
assert.throws(
  () => createDevelopmentTimelineReadiness({ state: {} }),
  error => error.code === 'INVALID_DEVELOPMENT_TIMELINE_READINESS'
);

console.log('Development timeline readiness tests passed.');
