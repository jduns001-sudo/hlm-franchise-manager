'use strict';

const { validateAtomicPersistencePlan } = require('./hlm-atomic-persistence');
const { createSaveEnvelope, loadSaveEnvelope } = require('./hlm-save-envelope');

function executeAtomicPersistence(plan, repository, slotId, metadata = {}) {
  const check = validateAtomicPersistencePlan(plan);
  if (!check.valid) {
    const e = new Error('Invalid atomic persistence plan');
    e.code = 'INVALID_PERSISTENCE_PLAN'; e.errors = check.errors; throw e;
  }
  if (!repository || typeof repository.save !== 'function' || typeof repository.load !== 'function') {
    throw new TypeError('Repository with save/load is required');
  }
  if (!slotId) throw new TypeError('slotId is required');

  const existed = typeof repository.has === 'function' ? repository.has(slotId) : false;
  const previous = existed ? repository.load(slotId) : null;
  const envelope = createSaveEnvelope(plan.candidateState, { ...metadata, saveId: slotId });

  try {
    repository.save(slotId, envelope);
    const written = repository.load(slotId);
    const verified = loadSaveEnvelope(written);
    if (!verified || !verified.state) throw new Error('Post-write verification failed');
    return { executed: true, verified: true, rolledBack: false, legacySourcePreserved: true, slotId };
  } catch (error) {
    try {
      if (existed) repository.save(slotId, previous);
      else if (typeof repository.remove === 'function') repository.remove(slotId);
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }
    error.persistenceRolledBack = true;
    throw error;
  }
}

module.exports = { executeAtomicPersistence };
