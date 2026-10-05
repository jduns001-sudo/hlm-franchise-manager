'use strict';
const assert = require('assert');
const {
  SEASON_PHASES,
  STANDARD_SEASON_PHASES,
  isStandardSeasonPhase,
  assertSeasonPhase,
  createSeasonPhase
} = require('./hlm-season-phase');

const expected = [
  'training-camp','preseason','regular-season','trade-deadline','playoffs','awards',
  'draft-lottery','draft','free-agency','offseason','international-break','all-star-event'
];
assert.deepStrictEqual(STANDARD_SEASON_PHASES, expected);
assert.strictEqual(Object.isFrozen(SEASON_PHASES), true);
assert.strictEqual(Object.isFrozen(STANDARD_SEASON_PHASES), true);

for (const phase of expected) {
  assert.strictEqual(isStandardSeasonPhase(phase), true);
  assert.strictEqual(assertSeasonPhase(phase), phase);
  const model = createSeasonPhase({ id: phase });
  assert.strictEqual(model.kind, 'season-phase');
  assert.strictEqual(model.version, 1);
  assert.strictEqual(model.id, phase);
  assert.strictEqual(model.custom, false);
  assert.strictEqual(Object.isFrozen(model), true);
}

assert.strictEqual(isStandardSeasonPhase('winter-classic'), false);
assert.throws(() => assertSeasonPhase('winter-classic'), e => e.code === 'INVALID_SEASON_PHASE');
assert.strictEqual(assertSeasonPhase('winter-classic', { allowCustom: true }), 'winter-classic');
const custom = createSeasonPhase({ id: 'winter-classic', custom: true });
assert.strictEqual(custom.id, 'winter-classic');
assert.strictEqual(custom.custom, true);
assert.throws(() => createSeasonPhase({ id: 'regular-season', custom: true }), e => e.code === 'INVALID_SEASON_PHASE');
assert.throws(() => createSeasonPhase({}), e => e.code === 'INVALID_SEASON_PHASE');

console.log('Season phase model tests passed.');
