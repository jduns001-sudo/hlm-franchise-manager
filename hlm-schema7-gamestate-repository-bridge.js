'use strict';

const { createSchema7ExecutionAdapter } = require('./hlm-schema7-execution-adapter');

function createSchema7GameStateRepositoryBridge(repository, slotId, metadata = {}) {
  if (!repository || typeof repository.save !== 'function' || typeof repository.load !== 'function' || typeof repository.remove !== 'function') {
    throw new Error('GameState repository with save/load/remove is required');
  }
  if (!slotId || typeof slotId !== 'string') throw new Error('slotId is required');

  return createSchema7ExecutionAdapter({
    writeIsolatedState: async candidate => {
      await repository.save(slotId, candidate, { ...metadata, replaceExisting: false });
    },
    readIsolatedState: async () => {
      const loaded = await repository.load(slotId);
      return loaded && loaded.state ? loaded.state : loaded;
    },
    removeIsolatedState: async () => {
      await repository.remove(slotId);
    }
  });
}

module.exports = { createSchema7GameStateRepositoryBridge };
