'use strict';

/**
 * Phase 2 runtime boundary for the existing Front Office.
 *
 * This adapter deliberately knows nothing about IndexedDB implementation
 * details. The live app supplies readLegacyState when it is ready to opt in.
 * No write function is accepted here.
 */
function createFrontOfficeRuntimeAdapter(options = {}) {
  const readLegacyState = options.readLegacyState;
  if (typeof readLegacyState !== 'function') throw new TypeError('readLegacyState function is required');

  return Object.freeze({
    kind: 'front-office-read-only-runtime-adapter',
    version: 1,
    async readLegacySnapshot() {
      const state = await readLegacyState();
      if (!state || typeof state !== 'object' || Array.isArray(state)) {
        const e = new Error('Front Office legacy state snapshot is invalid');
        e.code = 'INVALID_FRONT_OFFICE_SNAPSHOT';
        throw e;
      }
      return JSON.parse(JSON.stringify(state));
    }
  });
}

async function inspectFrontOfficeRuntime(adapter) {
  if (!adapter || adapter.kind !== 'front-office-read-only-runtime-adapter' || typeof adapter.readLegacySnapshot !== 'function') {
    throw new TypeError('Valid Front Office runtime adapter is required');
  }
  const snapshot = await adapter.readLegacySnapshot();
  return {
    readable: true,
    readOnly: true,
    playerCount: Array.isArray(snapshot.players) ? snapshot.players.length : 0,
    teamCount: Array.isArray(snapshot.teams) ? snapshot.teams.length : 0,
    contractCount: Array.isArray(snapshot.contracts) ? snapshot.contracts.length : 0,
    transactionCount: Array.isArray(snapshot.transactions) ? snapshot.transactions.length : 0,
    draftPickCount: Array.isArray(snapshot.draftPicks) ? snapshot.draftPicks.length : 0,
    controlledTeamId: snapshot.gmSettings && snapshot.gmSettings.controlledTeamId != null
      ? snapshot.gmSettings.controlledTeamId
      : snapshot.settings && snapshot.settings.controlledTeamId != null
        ? snapshot.settings.controlledTeamId
        : null
  };
}

module.exports = { createFrontOfficeRuntimeAdapter, inspectFrontOfficeRuntime };
