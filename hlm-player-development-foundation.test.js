'use strict';

const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { DEVELOPMENT_CURVES, DEVELOPMENT_STAGES, DEVELOPMENT_DIRECTIONS, DEFAULT_DEVELOPMENT_CHANGE_RULES, calculateAge, normalizeDevelopmentCurve, classifyDevelopmentStage, classifyDevelopmentDirection, normalizeDevelopmentFactor, calculateDevelopmentFactorSignal, classifyDevelopmentEvaluation, resolveDevelopmentContext, resolveDevelopmentLifecycle, normalizeAttributeRating, resolveAttributeDevelopmentDirection, resolveAttributeDevelopmentSnapshot, resolveAttributeDevelopmentChangePlan, resolveDevelopmentChangeAmount, applyDevelopmentChangePlan, createDevelopmentGameStateTransaction, resolveOverallRecalculationInput, resolveDevelopmentInputs } = require('./hlm-player-development-foundation');

const player = {
  id: 101,
  name: 'Foundation Test Player',
  birthYear: 2005,
  position: 'C',
  ovr: 72,
  potential: 'Elite',
  potentialLevel: 'High',
  attributes: { skating: 75, shooting: 71 },
  developmentTraits: { curve: 'normal', workEthic: 80, coachability: 77, discipline: 74, consistency: 76, adaptability: 79 },
  confidence: 73,
  iceTime: 16.5,
  role: 'Top-Six',
  training: { focus: 'skating' },
  coaching: { development: 82 },
  performance: { gamesPlayed: 12 },
  health: { status: 'healthy' },
  injuries: [],
  morale: 78,
  organization: { quality: 81 },
  retired: false
};
const state = createGameStateEnvelope({
  meta: { currentDate: '2026-10-06' },
  players: [player],
  injuries: [
    { id: 'inj-1', playerId: 101, status: 'day-to-day' },
    { id: 'inj-2', playerId: 999, status: 'out' }
  ]
});
const before = JSON.stringify(state);

assert.strictEqual(calculateAge(2005, '2026-10-06'), 21);
assert.deepStrictEqual(DEVELOPMENT_CURVES, ['early-bloomer', 'normal', 'late-bloomer', 'bust', 'elite']);
assert.strictEqual(normalizeDevelopmentCurve('Early Bloomer'), 'early-bloomer');
assert.strictEqual(normalizeDevelopmentCurve('late_bloomer'), 'late-bloomer');
assert.strictEqual(normalizeDevelopmentCurve('ELITE'), 'elite');
assert.strictEqual(normalizeDevelopmentCurve('unknown'), null);
assert.strictEqual(normalizeDevelopmentCurve(null), null);
assert.deepStrictEqual(DEVELOPMENT_STAGES, ['development', 'prime', 'decline']);
assert.strictEqual(classifyDevelopmentStage(22, 'normal'), 'development');
assert.strictEqual(classifyDevelopmentStage(25, 'normal'), 'prime');
assert.strictEqual(classifyDevelopmentStage(31, 'normal'), 'decline');
assert.strictEqual(classifyDevelopmentStage(23, 'early-bloomer'), 'prime');
assert.strictEqual(classifyDevelopmentStage(25, 'late-bloomer'), 'development');
assert.strictEqual(classifyDevelopmentStage(null, 'normal'), null);
assert.strictEqual(classifyDevelopmentStage(undefined, 'normal'), null);
assert.strictEqual(classifyDevelopmentStage('', 'normal'), null);
assert.deepStrictEqual(DEVELOPMENT_DIRECTIONS, ['growth', 'stable', 'decline']);
assert.strictEqual(classifyDevelopmentDirection('development'), 'growth');
assert.strictEqual(classifyDevelopmentDirection('prime'), 'stable');
assert.strictEqual(classifyDevelopmentDirection('decline'), 'decline');
assert.strictEqual(classifyDevelopmentDirection(null), null);
assert.strictEqual(classifyDevelopmentDirection('development', true), null);
assert.strictEqual(normalizeDevelopmentFactor(120), 100);
assert.strictEqual(normalizeDevelopmentFactor(-5), 0);
assert.strictEqual(normalizeDevelopmentFactor('80'), 80);
assert.strictEqual(normalizeDevelopmentFactor(null), null);
assert.strictEqual(normalizeDevelopmentFactor(undefined), null);
assert.deepStrictEqual(calculateDevelopmentFactorSignal({ workEthic: 80, coachability: 70, morale: 90 }), {
  score: 80, sampleSize: 3, availableFactors: ['workEthic', 'coachability', 'morale']
});
assert.strictEqual(calculateDevelopmentFactorSignal({}), null);
assert.deepStrictEqual(classifyDevelopmentEvaluation('growth', { score: 85 }), { direction: 'growth', pace: 'accelerating', score: 85 });
assert.deepStrictEqual(classifyDevelopmentEvaluation('growth', { score: 55 }), { direction: 'growth', pace: 'normal', score: 55 });
assert.deepStrictEqual(classifyDevelopmentEvaluation('growth', { score: 25 }), { direction: 'growth', pace: 'stalling', score: 25 });
assert.deepStrictEqual(classifyDevelopmentEvaluation('stable', null), { direction: 'stable', pace: 'normal', score: null });
assert.strictEqual(classifyDevelopmentEvaluation(null, { score: 90 }), null);
const context = resolveDevelopmentContext({
  overall: 72, linemates: ['A'], developmentStatus: 'progressing', league: 'AHL',
  organizationalDepth: 2, contract: { years: 2 }, coachingFit: 'good',
  limitedPlayingTime: false, poorPerformance: false, personalityConflicts: []
}, {
  iceTime: 18, role: 'top-six', training: 'skating', coaching: 'development',
  organization: 80, performance: 75, morale: 70, confidence: 65, injuries: []
});
assert.strictEqual(context.environment.role, 'top-six');
assert.strictEqual(context.environment.training, 'skating');
assert.strictEqual(context.promotion.ability, 72);
assert.strictEqual(context.promotion.league, 'AHL');
assert.deepStrictEqual(context.promotion.contract, { years: 2 });
assert.deepStrictEqual(context.setbacks.injuries, []);
assert.strictEqual(context.setbacks.coachingFit, 'good');
assert.ok(Object.isFrozen(context));
assert.ok(Object.isFrozen(context.environment));
const lifecycle = resolveDevelopmentLifecycle({
  position: 'G', age: 34, retired: false, contract: { years: 1 },
  careerSatisfaction: 60, draftStatus: { year: 2012 }, promotions: ['NHL'],
  breakouts: ['2020'], developmentSetbacks: ['injury'], awards: ['Vezina'], milestones: ['500 GP']
}, 'decline', { pace: 'stalling', direction: 'decline', score: 35 }, { injuries: [{ type: 'knee' }] }, 34);
assert.strictEqual(lifecycle.goalie.specializedDevelopment, true);
assert.strictEqual(lifecycle.aging.attributeSpecificDeclineReady, true);
assert.strictEqual(lifecycle.retirement.decliningAbility, true);
assert.strictEqual(lifecycle.retirement.age, 34);
assert.deepStrictEqual(lifecycle.history.promotions, ['NHL']);
assert.deepStrictEqual(lifecycle.report, { status: 'stalling', direction: 'decline', score: 35 });
assert.ok(Object.isFrozen(lifecycle));
const changePlan = resolveAttributeDevelopmentChangePlan([
  Object.freeze({ name: 'skating', currentValue: 70, developmentDirection: 'growth' }),
  Object.freeze({ name: 'defense', currentValue: 68, developmentDirection: 'stable' }),
  Object.freeze({ name: 'strength', currentValue: 65, developmentDirection: 'decline' })
], Object.freeze({ direction: 'growth', pace: 'accelerating', score: 82 }));
assert.deepStrictEqual(changePlan.map(x => [x.name, x.direction, x.pace, x.factorScore, x.changePending]), [
  ['skating', 'growth', 'accelerating', 82, true],
  ['defense', 'stable', 'accelerating', 82, false],
  ['strength', 'decline', 'accelerating', 82, true]
]);
assert.ok(Object.isFrozen(changePlan));
assert.strictEqual(resolveAttributeDevelopmentChangePlan(null, null), null);
assert.strictEqual(resolveDevelopmentChangeAmount('growth', 'accelerating'), 2);
assert.strictEqual(resolveDevelopmentChangeAmount('growth', 'normal'), 1);
assert.strictEqual(resolveDevelopmentChangeAmount('growth', 'stalling'), 0);
assert.strictEqual(resolveDevelopmentChangeAmount('stable', 'normal'), 0);
assert.strictEqual(resolveDevelopmentChangeAmount('decline', 'stalling'), -2);
const appliedChanges = applyDevelopmentChangePlan(changePlan);
assert.deepStrictEqual(appliedChanges.map(x => [x.name, x.changeAmount, x.nextValue, x.changed]), [
  ['skating', 2, 72, true],
  ['defense', 0, 68, false],
  ['strength', -1, 64, true]
]);
assert.strictEqual(DEFAULT_DEVELOPMENT_CHANGE_RULES.maximumRating, 100);
assert.strictEqual(normalizeAttributeRating(75), 75);
assert.strictEqual(normalizeAttributeRating('71'), 71);
assert.strictEqual(normalizeAttributeRating(null), null);
assert.strictEqual(normalizeAttributeRating(undefined), null);
assert.strictEqual(normalizeAttributeRating(''), null);
assert.strictEqual(normalizeAttributeRating(false), null);
assert.strictEqual(normalizeAttributeRating(true), null);
assert.strictEqual(normalizeAttributeRating('raw'), null);
assert.strictEqual(normalizeAttributeRating({ value: 75 }), null);
assert.strictEqual(resolveAttributeDevelopmentDirection('skating', 'growth'), 'growth');
assert.strictEqual(resolveAttributeDevelopmentDirection('skating', 'growth', { skating: 'stable' }), 'stable');
assert.strictEqual(resolveAttributeDevelopmentDirection('shooting', 'growth', { skating: 'decline' }), 'growth');
assert.strictEqual(resolveAttributeDevelopmentDirection('skating', 'growth', { skating: 'unknown' }), 'growth');
assert.strictEqual(resolveAttributeDevelopmentDirection('', 'growth', { skating: 'decline' }), 'growth');
assert.strictEqual(resolveAttributeDevelopmentDirection('skating', null, { skating: 'growth' }), null);
assert.deepStrictEqual(resolveAttributeDevelopmentSnapshot({ skating: 75, shooting: '71', note: 'raw' }, 'growth'), [
  { name: 'skating', currentValue: 75, developmentDirection: 'growth' },
  { name: 'shooting', currentValue: 71, developmentDirection: 'growth' }
]);
assert.deepStrictEqual(resolveAttributeDevelopmentSnapshot({ skating: 75, shooting: 71 }, 'growth', { skating: 'stable', shooting: 'decline' }), [
  { name: 'skating', currentValue: 75, developmentDirection: 'stable' },
  { name: 'shooting', currentValue: 71, developmentDirection: 'decline' }
]);
assert.strictEqual(resolveAttributeDevelopmentSnapshot(null, 'growth'), null);
assert.strictEqual(resolveAttributeDevelopmentSnapshot({}, 'growth'), null);
assert.strictEqual(resolveAttributeDevelopmentSnapshot({ skating: null, shooting: '', strength: false, note: 'raw' }, 'growth'), null);
assert.deepStrictEqual(resolveAttributeDevelopmentSnapshot({ skating: 75, shooting: '71', missing: null, enabled: false }, 'growth'), [
  { name: 'skating', currentValue: 75, developmentDirection: 'growth' },
  { name: 'shooting', currentValue: 71, developmentDirection: 'growth' }
]);
assert.strictEqual(resolveOverallRecalculationInput({ skating: null, shooting: '', strength: false }), null);
assert.deepStrictEqual(resolveOverallRecalculationInput({ skating: 75, shooting: '71', missing: null, enabled: false, note: 'raw' }), {
  attributes: [{ name: 'skating', value: 75 }, { name: 'shooting', value: 71 }],
  attributeCount: 2
});
assert.deepStrictEqual(resolveOverallRecalculationInput({ skating: 75, shooting: '71', note: 'raw' }), {
  attributes: [{ name: 'skating', value: 75 }, { name: 'shooting', value: 71 }],
  attributeCount: 2
});
assert.strictEqual(resolveOverallRecalculationInput(null), null);
assert.strictEqual(resolveOverallRecalculationInput({}), null);

const first = resolveDevelopmentInputs(state, 101);
const second = resolveDevelopmentInputs(state, 101);
assert.deepStrictEqual(first, second);
assert.strictEqual(first.playerId, 101);
assert.strictEqual(first.currentDate, '2026-10-06');
assert.strictEqual(first.age, 21);
assert.strictEqual(first.overall, 72);
assert.strictEqual(first.potential, 'Elite');
assert.strictEqual(first.potentialLevel, 'High');
assert.deepStrictEqual(first.attributes, { skating: 75, shooting: 71 });
assert.deepStrictEqual(first.developmentTraits, { curve: 'normal', workEthic: 80, coachability: 77, discipline: 74, consistency: 76, adaptability: 79 });
assert.strictEqual(first.developmentCurve, 'normal');
assert.strictEqual(first.developmentStage, 'development');
assert.strictEqual(first.developmentDirection, 'growth');
assert.deepStrictEqual(first.attributeDevelopment, [
  { name: 'skating', currentValue: 75, developmentDirection: 'growth' },
  { name: 'shooting', currentValue: 71, developmentDirection: 'growth' }
]);
assert.strictEqual(Object.isFrozen(first.attributeDevelopment), true);
assert.strictEqual(Object.isFrozen(first.attributeDevelopment[0]), true);
assert.deepStrictEqual(first.overallRecalculationInput, {
  attributes: [{ name: 'skating', value: 75 }, { name: 'shooting', value: 71 }],
  attributeCount: 2
});
assert.strictEqual(Object.isFrozen(first.overallRecalculationInput), true);
assert.strictEqual(Object.isFrozen(first.overallRecalculationInput.attributes), true);
assert.deepStrictEqual(first.factors, {
  workEthic: 80, coachability: 77, discipline: 74, confidence: 73, consistency: 76, adaptability: 79,
  iceTime: 16.5, role: 'Top-Six', training: { focus: 'skating' }, coaching: { development: 82 },
  performance: { gamesPlayed: 12 }, health: { status: 'healthy' },
  injuries: [{ id: 'inj-1', playerId: 101, status: 'day-to-day' }], morale: 78,
  organization: { quality: 81 }
});
assert.deepStrictEqual(first.factorSignal, {
  score: 76.71,
  sampleSize: 7,
  availableFactors: ['workEthic', 'coachability', 'discipline', 'confidence', 'consistency', 'adaptability', 'morale']
});
assert.strictEqual(Object.isFrozen(first.factorSignal), true);
assert.strictEqual(Object.isFrozen(first.factorSignal.availableFactors), true);
assert.strictEqual(Object.isFrozen(first.factors), true);
assert.strictEqual(Object.isFrozen(first), true);
assert.strictEqual(JSON.stringify(state), before, 'development input resolution must not mutate GameState');

const retiredPlayer = { ...player, id: 103, retired: true, attributeDevelopmentDirections: { skating: 'growth' } };
const retiredState = createGameStateEnvelope({ meta: { currentDate: '2026-10-06' }, players: [retiredPlayer] });
const retiredInputs = resolveDevelopmentInputs(retiredState, 103);
assert.strictEqual(retiredInputs.developmentDirection, null);
assert.deepStrictEqual(retiredInputs.attributeDevelopment, [
  { name: 'skating', currentValue: 75, developmentDirection: null },
  { name: 'shooting', currentValue: 71, developmentDirection: null }
]);

assert.throws(() => resolveDevelopmentInputs(state, 0), e => e.code === 'INVALID_PLAYER_ID');
assert.throws(() => resolveDevelopmentInputs(state, 999), e => e.code === 'PLAYER_NOT_FOUND');
assert.throws(() => resolveDevelopmentInputs({}, 101), e => e.code === 'INVALID_GAME_STATE');

const badDate = createGameStateEnvelope({ meta: { currentDate: 'not-a-date' }, players: [player] });
assert.throws(() => resolveDevelopmentInputs(badDate, 101), e => e.code === 'INVALID_DEVELOPMENT_DATE');

const duplicate = createGameStateEnvelope({ meta: { currentDate: '2026-10-06' }, players: [player, { ...player }] });
assert.throws(() => resolveDevelopmentInputs(duplicate, 101), e => e.code === 'DUPLICATE_PLAYER_ID');

const sparse = createGameStateEnvelope({
  meta: { currentDate: '2026-10-06' },
  players: [{ id: 102, name: 'Sparse Player' }]
});
const sparseInputs = resolveDevelopmentInputs(sparse, 102);
assert.strictEqual(sparseInputs.age, null);
assert.strictEqual(sparseInputs.overall, null);
assert.strictEqual(sparseInputs.potential, null);
assert.strictEqual(sparseInputs.attributes, null);
assert.strictEqual(sparseInputs.developmentCurve, null);
assert.strictEqual(sparseInputs.developmentStage, null);
assert.strictEqual(sparseInputs.developmentDirection, null);
assert.strictEqual(sparseInputs.factorSignal, null);
assert.strictEqual(sparseInputs.attributeDevelopmentDirections, null);
assert.strictEqual(sparseInputs.attributeDevelopment, null);
assert.strictEqual(sparseInputs.overallRecalculationInput, null);
assert.deepStrictEqual(sparseInputs.factors, {
  workEthic: null, coachability: null, discipline: null, confidence: null, consistency: null, adaptability: null,
  iceTime: null, role: null, training: null, coaching: null, performance: null, health: null, injuries: [],
  morale: null, organization: null
});

const transactionState = JSON.parse(JSON.stringify(state));
const originalTransactionState = JSON.parse(JSON.stringify(transactionState));
const transaction = createDevelopmentGameStateTransaction(transactionState, 7);
assert.strictEqual(transaction.executable, true);
assert.ok(transaction.changedAttributes > 0);
assert.strictEqual(transaction.candidateState.universe.players[0].attributes.skating, 72);
assert.deepStrictEqual(transactionState, originalTransactionState);
assert.notStrictEqual(transaction.candidateState, transactionState);
assert.strictEqual(createDevelopmentGameStateTransaction({
  meta: { currentDate: '2027-07-01' },
  universe: { players: [{ id: 8, birthYear: 2000, attributes: { skating: 70 }, retired: true }] },
  activity: { injuries: [] }
}, 8).executable, false);

console.log('Player development foundation tests passed.');
