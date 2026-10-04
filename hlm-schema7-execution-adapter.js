'use strict';

const { evaluateSchema7ExecutionPreflight } = require('./hlm-schema7-execution-preflight');

function createSchema7ExecutionAdapter(dependencies = {}) {
  const { writeIsolatedState, readIsolatedState, removeIsolatedState } = dependencies;
  if (typeof writeIsolatedState !== 'function') throw new Error('writeIsolatedState is required');
  if (typeof readIsolatedState !== 'function') throw new Error('readIsolatedState is required');
  if (typeof removeIsolatedState !== 'function') throw new Error('removeIsolatedState is required');

  return Object.freeze({
    async execute(executionPackage) {
      const preflight = evaluateSchema7ExecutionPreflight(executionPackage);
      if (!preflight.ready) {
        return Object.freeze({ executed: false, verified: false, rolledBack: false, blockers: preflight.blockers });
      }

      let wrote = false;
      try {
        await writeIsolatedState(executionPackage.candidate);
        wrote = true;
        const reloaded = await readIsolatedState();
        const verified = JSON.stringify(reloaded) === JSON.stringify(executionPackage.candidate);
        if (!verified) throw new Error('Post-write verification failed');
        return Object.freeze({ executed: true, verified: true, rolledBack: false, blockers: Object.freeze([]) });
      } catch (error) {
        if (wrote) await removeIsolatedState();
        return Object.freeze({
          executed: false,
          verified: false,
          rolledBack: wrote,
          blockers: Object.freeze([error && error.message ? error.message : 'Execution failed'])
        });
      }
    }
  });
}

module.exports = { createSchema7ExecutionAdapter };
