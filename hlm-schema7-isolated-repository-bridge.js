'use strict';

const { createSchema7ExecutionAdapter } = require('./hlm-schema7-execution-adapter');

function createSchema7IsolatedRepositoryBridge(repository, slotId, metadata = {}) {
  if (!repository || typeof repository.save !== 'function' || typeof repository.load !== 'function' || typeof repository.remove !== 'function') {
    throw new Error('Save repository with save/load/remove is required');
  }
  const id = String(slotId || '').trim();
  if (!id) throw new Error('Isolated save slot ID is required');

  const adapter = createSchema7ExecutionAdapter({
    writeIsolatedState: async state => {
      const exists = typeof repository.has === 'function' && repository.has(id);
      repository.save(id, state, metadata, { replace: Boolean(exists) });
    },
    readIsolatedState: async () => {
      const loaded = repository.load(id);
      return loaded && loaded.state;
    },
    removeIsolatedState: async () => {
      if (typeof repository.has !== 'function' || repository.has(id)) repository.remove(id);
    }
  });

  return Object.freeze({
    slotId: id,
    target: 'isolated-game-state-save',
    sourceAccess: false,
    execute: executionPackage => adapter.execute(executionPackage)
  });
}

module.exports = { createSchema7IsolatedRepositoryBridge };
