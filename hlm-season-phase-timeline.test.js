'use strict';
const assert = require('assert');
const { createPhaseWindow, createSeasonPhaseTimeline } = require('./hlm-season-phase-timeline');

const window = createPhaseWindow({
  phaseId: 'preseason',
  startDate: '2026-09-20',
  endDate: '2026-10-05'
});
assert.strictEqual(window.phase.id, 'preseason');
assert.strictEqual(Object.isFrozen(window), true);
assert.throws(() => createPhaseWindow({
  phaseId: 'regular-season',
  startDate: '2026-10-10',
  endDate: '2026-10-09'
}), e => e.code === 'INVALID_PHASE_WINDOW');

const timeline = createSeasonPhaseTimeline({
  windows: [
    { phaseId: 'regular-season', startDate: '2026-10-06', endDate: '2027-04-17' },
    { phaseId: 'training-camp', startDate: '2026-09-10', endDate: '2026-09-19' },
    { phaseId: 'preseason', startDate: '2026-09-20', endDate: '2026-10-05' },
    { phaseId: 'winter-classic', custom: true, startDate: '2027-01-01', endDate: '2027-01-01' }
  ].filter(item => item.phaseId !== 'winter-classic')
});

assert.deepStrictEqual(timeline.windows.map(item => item.phase.id), [
  'training-camp', 'preseason', 'regular-season'
]);
assert.strictEqual(timeline.phaseOn('2026-09-10').id, 'training-camp');
assert.strictEqual(timeline.phaseOn('2026-10-05').id, 'preseason');
assert.strictEqual(timeline.phaseOn('2026-10-06').id, 'regular-season');
assert.strictEqual(timeline.phaseOn('2027-04-18'), null);
assert.strictEqual(Object.isFrozen(timeline), true);
assert.strictEqual(Object.isFrozen(timeline.windows), true);

const customTimeline = createSeasonPhaseTimeline({
  windows: [{ phaseId: 'winter-classic', custom: true, startDate: '2027-01-01', endDate: '2027-01-01' }]
});
assert.strictEqual(customTimeline.phaseOn('2027-01-01').id, 'winter-classic');
assert.strictEqual(customTimeline.phaseOn('2027-01-01').custom, true);

assert.throws(() => createSeasonPhaseTimeline({
  windows: [
    { phaseId: 'preseason', startDate: '2026-10-01', endDate: '2026-10-10' },
    { phaseId: 'regular-season', startDate: '2026-10-10', endDate: '2027-04-17' }
  ]
}), e => e.code === 'OVERLAPPING_PHASE_WINDOWS');
assert.throws(() => createSeasonPhaseTimeline({ windows: 'nope' }), e => e.code === 'INVALID_PHASE_TIMELINE');

console.log('Season phase timeline tests passed.');
