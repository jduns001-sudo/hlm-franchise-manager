'use strict';
const assert = require('assert');
const { inspectDraftPickSources } = require('./hlm-draft-pick-source-authority');

const universe = [{ year: 2027, round: 1, originalTeamId: 5, ownerTeamId: 5 }];
const legacy = [{ year: 2027, round: 1, originalTeamId: 5, ownerTeamId: 6 }];
const result = inspectDraftPickSources(universe, legacy);
assert.strictEqual(result.operationalSource, 'legacy');
assert.strictEqual(result.universe.role, 'reference');
assert.strictEqual(result.legacy.role, 'operational-overlay');
assert.strictEqual(result.universePromotionAllowed, false);
assert.strictEqual(result.identityMigrationRequired, true);

const noLegacy = inspectDraftPickSources(universe, []);
assert.strictEqual(noLegacy.operationalSource, 'universe-reference-only');
assert.strictEqual(noLegacy.permanentIdentityReady, false);
assert.strictEqual(noLegacy.universePromotionAllowed, false);

console.log('DraftPick source authority tests passed.');
