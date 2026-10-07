'use strict';

const { validateGameStateEnvelope } = require('./hlm-game-state');

function verificationError(message) {
  const error = new Error(message);
  error.code = 'INVALID_DEVELOPMENT_CANDIDATE_VERIFICATION';
  return error;
}

function verifyDevelopmentEvaluationPackage(input = {}) {
  const sourceState = input.sourceState;
  const evaluationPackage = input.evaluationPackage;
  if (!validateGameStateEnvelope(sourceState).valid) throw verificationError('A valid source GameState is required.');
  if (!evaluationPackage || evaluationPackage.kind !== 'development-evaluation-package' || evaluationPackage.version !== 1)
    throw verificationError('A valid development evaluation package is required.');

  const sourceSnapshot = JSON.stringify(sourceState);
  const transactions = evaluationPackage.transactions || [];
  const executable = transactions.filter(transaction => transaction.executable);
  const countVerified = executable.length === evaluationPackage.executableTransactions;
  const candidateRequired = executable.length > 0;
  const candidatePresent = candidateRequired ? validateGameStateEnvelope(evaluationPackage.candidateState).valid : evaluationPackage.candidateState === null;
  const ids = sourceState.universe.players.map(player => String(player.id));
  const candidateIds = candidateRequired ? evaluationPackage.candidateState.universe.players.map(player => String(player.id)) : ids;
  const identityVerified = ids.length === candidateIds.length && ids.every((id, index) => id === candidateIds[index]);
  const dateVerified = !candidateRequired || evaluationPackage.candidateState.meta.currentDate === sourceState.meta.currentDate;
  const sourceUnchanged = JSON.stringify(sourceState) === sourceSnapshot;
  const persistenceUnperformed = evaluationPackage.persistencePerformed === false;

  const verified = evaluationPackage.ready === true && countVerified && candidatePresent && identityVerified && dateVerified && sourceUnchanged && persistenceUnperformed;
  return Object.freeze({
    kind: 'development-evaluation-package-verification',
    version: 1,
    verified,
    countVerified,
    candidatePresent,
    identityVerified,
    dateVerified,
    sourceUnchanged,
    persistenceUnperformed,
    executableTransactions: executable.length,
    sourceState,
    candidateState: evaluationPackage.candidateState,
    evaluationPackage
  });
}

module.exports = { verifyDevelopmentEvaluationPackage };
