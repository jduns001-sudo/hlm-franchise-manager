'use strict';

const { preflightFrontOfficeState } = require('./hlm-front-office-read-preflight');

/**
 * Host-facing diagnostic hook contract.
 *
 * The existing Front Office may inject its proven readState function here.
 * This module intentionally accepts no writeState, database handle, storage
 * object, or persistence callback.
 */
function createFrontOfficeDiagnosticHook(readState, options = {}) {
  if (typeof readState !== 'function') throw new TypeError('readState function is required');

  let running = false;
  return Object.freeze({
    kind: 'front-office-phase2-diagnostic-hook',
    version: 1,
    async run() {
      if (running) {
        const e = new Error('Front Office diagnostic is already running');
        e.code = 'DIAGNOSTIC_ALREADY_RUNNING';
        throw e;
      }
      running = true;
      try {
        const report = await preflightFrontOfficeState(readState, options);
        return Object.freeze({
          ...report,
          diagnosticOnly: true,
          persistenceEnabled: false
        });
      } finally {
        running = false;
      }
    }
  });
}

module.exports = { createFrontOfficeDiagnosticHook };
