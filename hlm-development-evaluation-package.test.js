'use strict';

const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createDevelopmentEvaluationPackage } = require('./hlm-development-evaluation-package');

const state = createGameStateEnvelope({
  meta: { currentDate: '2027-07-01' },
  players: [
    { id: 1, birthYear: 2005, position: 'C', attributes: { skating: 70 }, developmentTraits: { curve: 'normal', workEthic: 80, coachability: 80, discipline: 80, consistency: 80, adaptability: 80 }, confidence: 80, morale: 80 },
    { id: 2, birthYear: 1990, position: 'D', attributes: { defense: 80 }, developmentTraits: { curve: 'normal', workEthic: 50, coachability: 50, discipline: 50, consistency: 50, adaptability: 50 }, confidence: 50, morale: 50 }
  ]
});
const before = JSON.stringify(state);

const waiting = createDevelopmentEvaluationPackage({ state, cadence: 'configured-checkpoint', due: false });
assert.strictEqual(waiting.ready, false);
assert.strictEqual(waiting.transactions.length, 0);
assert.strictEqual(waiting.candidateState, null);

const due = createDevelopmentEvaluationPackage({ state, cadence: 'configured-checkpoint', due: true });
assert.strictEqual(due.ready, true);
assert.strictEqual(due.transactions.length, 2);
assert.strictEqual(due.executableTransactions, 2);
assert.strictEqual(due.candidateState.universe.players[0].attributes.skating, 72);
assert.strictEqual(due.candidateState.universe.players[1].attributes.defense, 79);
assert.strictEqual(due.persistencePerformed, false);
assert.strictEqual(JSON.stringify(state), before);

console.log('Development evaluation package tests passed.');
