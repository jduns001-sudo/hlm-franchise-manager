'use strict';
const assert = require('assert');
const { resolvePotentialRevisionEvidence, resolveGoalieDevelopmentProfile, resolveDevelopmentDecisionReadiness, createDevelopmentHistoryEvent } = require('./hlm-development-advanced-foundations');

const potential = resolvePotentialRevisionEvidence({ potential: 'Elite', potentialLevel: 'High', potentialConfidence: 72, developmentEvaluation: { pace: 'accelerating', direction: 'growth' } });
assert.strictEqual(potential.revisionReady, true);
assert.strictEqual(potential.scoutingLagSupported, true);
assert.strictEqual(potential.revisedPotential, null);

const goalie = resolveGoalieDevelopmentProfile({ position: 'G' });
assert.strictEqual(goalie.goalie, true);
assert.strictEqual(goalie.specializedMaturityRequired, true);
assert.strictEqual(goalie.maturityAdjustment, null);
assert.strictEqual(resolveGoalieDevelopmentProfile({ position: 'C' }).goalie, false);

const decisions = resolveDevelopmentDecisionReadiness({
  promotion: { ability: 76, age: 21 },
  setbacks: { injuries: [{ type: 'knee' }] },
  retirement: { age: 36, decliningAbility: true }
});
assert.strictEqual(decisions.promotion.evidenceReady, true);
assert.strictEqual(decisions.setback.evidenceReady, true);
assert.strictEqual(decisions.retirement.evidenceReady, true);
assert.strictEqual(decisions.promotion.decision, null);

const event = createDevelopmentHistoryEvent({ playerId: 7, date: '2028-01-01', type: 'breakout', details: { note: 'top-six role' } });
assert.strictEqual(event.kind, 'development-history-event');
assert.strictEqual(event.persistencePerformed, false);
assert.strictEqual(createDevelopmentHistoryEvent({ playerId: 7, date: '2028-01-01', type: 'unknown' }), null);

console.log('Development advanced foundations tests passed.');
