'use strict';

const { createDevelopmentTimelineReadiness } = require('./hlm-development-timeline-readiness');
const { createDevelopmentGameStateTransaction, DEFAULT_DEVELOPMENT_CHANGE_RULES } = require('./hlm-player-development-foundation');

function packageError(message) {
  const error = new Error(message);
  error.code = 'INVALID_DEVELOPMENT_EVALUATION_PACKAGE';
  return error;
}

function createDevelopmentEvaluationPackage(input = {}) {
  const state = input.state;
  const readiness = createDevelopmentTimelineReadiness({
    state,
    currentDate: input.currentDate,
    cadence: input.cadence,
    due: input.due
  });

  if (!readiness.ready) {
    return Object.freeze({
      kind: 'development-evaluation-package',
      version: 1,
      ready: false,
      readiness,
      transactions: Object.freeze([]),
      executableTransactions: 0,
      candidateState: null,
      persistencePerformed: false
    });
  }

  const players = state.universe && Array.isArray(state.universe.players) ? state.universe.players : [];
  let workingState = state;
  const transactions = [];

  for (const player of players) {
    const transaction = createDevelopmentGameStateTransaction(
      workingState,
      player.id,
      input.rules ?? DEFAULT_DEVELOPMENT_CHANGE_RULES,
      input.overallStrategy ?? null
    );
    transactions.push(transaction);
    if (transaction.executable && transaction.candidateState) workingState = transaction.candidateState;
  }

  const executableTransactions = transactions.filter(transaction => transaction.executable).length;
  return Object.freeze({
    kind: 'development-evaluation-package',
    version: 1,
    ready: true,
    readiness,
    transactions: Object.freeze(transactions),
    executableTransactions,
    candidateState: executableTransactions > 0 ? workingState : null,
    persistencePerformed: false
  });
}

module.exports = { createDevelopmentEvaluationPackage };
