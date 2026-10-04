'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { resolveDeferredLegacyFields } = require('./hlm-deferred-legacy-policy');

const legacy = {
  awards: [{ name: 'MVP' }],
  draftClasses: [{ year: 2027 }],
  gmSettings: { controlledTeamId: 5, mode: 'gm' },
  snapshot: { note: 'old snapshot' },
  franchiseName: 'Legacy Franchise'
};
const state = createGameStateEnvelope();
const before = JSON.stringify(legacy);
const result = resolveDeferredLegacyFields(legacy, state);

assert.strictEqual(result.dataDiscarded, false);
assert.strictEqual(result.state.meta.controlledTeamId, 5);
assert.deepStrictEqual(result.state.extensions.legacy.preserved.awards, legacy.awards);
assert.strictEqual(result.state.extensions.legacy.preserved.franchiseName, 'Legacy Franchise');
assert.strictEqual(JSON.stringify(legacy), before);
assert.strictEqual(state.meta.controlledTeamId, null);

console.log('Deferred legacy field policy tests passed.');
