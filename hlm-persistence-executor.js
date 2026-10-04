'use strict';

const { validateAtomicPersistencePlan } = require('./hlm-atomic-persistence');
const { validateGameStateEnvelope } = require('./hlm-game-state');

function executeAtomicPersistence(plan, repository, slotId, metadata = {}) {
  const check = validateAtomicPersistencePlan(plan);
  if (!check.valid) {
    const e = new Error('Invalid atomic persistence plan');
    e.code = 'INVALID_PERSISTENCE_PLAN'; e.errors = check.errors; throw e;
  }
  const stateCheck = validateGameStateEnvelope(plan.candidateState);
  if (!stateCheck.valid) {
    const e = new Error('Candidate GameState is invalid');
    e.code = 'INVALID_CANDIDATE_STATE'; e.errors = stateCheck.errors; throw e;
  }
  if (!repository || typeof repository.save !== 'function' || typeof repository.load !== 'function') {
    throw new TypeError('Repository with save/load is required');
  }
  if (!slotId) throw new TypeError('slotId is required');

  const existed = typeof repository.has === 'function' ? repository.has(slotId) : false;
  const previous = existed ? repository.load(slotId) : null;

  try {
    repository.save(slotId, plan.candidateState, { ...metadata, saveId: slotId }, { replace: existed });
    const written = repository.load(slotId);
    if (!written || !written.state) throw new Error('Post-write verification failed');
    const verify = validateGameStateEnvelope(written.state);
    if (!verify.valid) throw new Error('Post-write GameState validation failed');
    return { executed: true, verified: true, rolledBack: false, legacySourcePreserved: true, slotId };
  } catch (error) {
    try {
      if (existed && previous && previous.state) {
        repository.save(slotId, previous.state, previous.envelope ? previous.envelope.metadata : {}, { replace: true });
      } else if (typeof repository.has === 'function' && repository.has(slotId) && typeof repository.remove === 'function') {
        repository.remove(slotId);
      }
    } catch (rollbackError) { error.rollbackError = rollbackError; }
    error.persistenceRolledBack = true;
    throw error;
  }
}

module.exports = { executeAtomicPersistence };
