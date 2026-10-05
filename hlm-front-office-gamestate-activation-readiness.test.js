'use strict';
const assert = require('assert');
const { createFrontOfficeRuntimeAdapter } = require('./hlm-front-office-runtime-adapter');
const { evaluateFrontOfficeGameStateActivationReadiness } = require('./hlm-front-office-gamestate-activation-readiness');

const verified = Object.freeze({
  kind: 'isolated-gamestate-activation-verification',
  version: 1,
  verified: true,
  slotId: 'mission71',
  stateMatches: true,
  storageUnchanged: true,
  frontOfficeActivationPerformed: false,
  legacySourceDeletionAllowed: false,
  blockers: Object.freeze([])
});

(async () => {
  let reads = 0;
  const adapter = createFrontOfficeRuntimeAdapter({
    readLegacyState: async () => {
      reads += 1;
      return { schema: 7, players: [{ id: 'p1' }], teams: [{ id: 't1' }] };
    }
  });

  const ready = await evaluateFrontOfficeGameStateActivationReadiness(adapter, verified);
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.slotId, 'mission71');
  assert.strictEqual(ready.isolatedActivationVerified, true);
  assert.strictEqual(ready.legacyRuntimeReadable, true);
  assert.strictEqual(ready.legacyRuntimeReadOnly, true);
  assert.strictEqual(ready.gameStateSourceOfTruthAuthorized, false);
  assert.strictEqual(ready.frontOfficeActivationAllowed, false);
  assert.strictEqual(ready.frontOfficeActivationPerformed, false);
  assert.strictEqual(ready.legacySourceDeletionAllowed, false);
  assert.strictEqual(reads, 1);
  assert.deepStrictEqual(ready.blockers, []);

  const badVerification = await evaluateFrontOfficeGameStateActivationReadiness(adapter, Object.freeze({
    ...verified,
    verified: false,
    blockers: Object.freeze(['isolated verification failed'])
  }));
  assert.strictEqual(badVerification.ready, false);
  assert(badVerification.blockers.includes('isolated verification failed'));

  const unreadable = createFrontOfficeRuntimeAdapter({
    readLegacyState: async () => { throw new Error('unavailable'); }
  });
  const unreadableResult = await evaluateFrontOfficeGameStateActivationReadiness(unreadable, verified);
  assert.strictEqual(unreadableResult.ready, false);
  assert(unreadableResult.blockers.includes('Front Office legacy snapshot could not be read'));

  const invalidAdapter = await evaluateFrontOfficeGameStateActivationReadiness(null, verified);
  assert.strictEqual(invalidAdapter.ready, false);
  assert(invalidAdapter.blockers.includes('Read-only Front Office runtime adapter is required'));

  console.log('Front Office GameState activation readiness tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
