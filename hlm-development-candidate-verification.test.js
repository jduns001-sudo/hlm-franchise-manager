'use strict';

const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createDevelopmentEvaluationPackage } = require('./hlm-development-evaluation-package');
const { verifyDevelopmentEvaluationPackage } = require('./hlm-development-candidate-verification');

const state = createGameStateEnvelope({
  meta: { currentDate: '2027-07-01' },
  players: [{ id: 1, birthYear: 2005, position: 'C', attributes: { skating: 70 }, developmentTraits: { curve: 'normal', workEthic: 80, coachability: 80, discipline: 80, consistency: 80, adaptability: 80 }, confidence: 80, morale: 80 }]
});
const before = JSON.stringify(state);
const pkg = createDevelopmentEvaluationPackage({ state, cadence: 'configured-checkpoint', due: true });
const verification = verifyDevelopmentEvaluationPackage({ sourceState: state, evaluationPackage: pkg });
assert.strictEqual(verification.verified, true);
assert.strictEqual(verification.countVerified, true);
assert.strictEqual(verification.identityVerified, true);
assert.strictEqual(verification.dateVerified, true);
assert.strictEqual(verification.sourceUnchanged, true);
assert.strictEqual(verification.persistenceUnperformed, true);
assert.strictEqual(JSON.stringify(state), before);

const tampered = Object.freeze({ ...pkg, executableTransactions: 99 });
const failed = verifyDevelopmentEvaluationPackage({ sourceState: state, evaluationPackage: tampered });
assert.strictEqual(failed.verified, false);
assert.strictEqual(failed.countVerified, false);

console.log('Development candidate verification tests passed.');
