'use strict';

const { projectGameStateForFrontOffice } = require('./hlm-front-office-gamestate-projection');

function createFrontOfficeLiveWiringBoundary(options = {}) {
  const readiness = options.readiness;
  const legacyAdapter = options.legacyAdapter;
  const guardedSelector = options.guardedSelector;

  if (!readiness || readiness.kind !== 'front-office-live-cutover-readiness' ||
      readiness.ready !== true || readiness.liveWiringMissionMayBePrepared !== true) {
    throw new Error('Verified Front Office live cutover readiness is required');
  }
  if (!legacyAdapter || legacyAdapter.kind !== 'front-office-read-only-runtime-adapter' ||
      typeof legacyAdapter.readLegacySnapshot !== 'function') {
    throw new TypeError('Read-only Front Office legacy adapter is required');
  }
  if (!guardedSelector || guardedSelector.kind !== 'bound-front-office-source-selector-guard' ||
      typeof guardedSelector.read !== 'function') {
    throw new TypeError('Bound Front Office source selector guard is required');
  }
  if (!readiness.slotId || guardedSelector.slotId !== readiness.slotId) {
    throw new Error('Live wiring boundary slot must match verified cutover readiness');
  }

  return Object.freeze({
    kind: 'front-office-live-wiring-boundary',
    version: 1,
    slotId: readiness.slotId,
    get source() { return guardedSelector.source; },
    async readFrontOfficeSnapshot() {
      if (guardedSelector.source === 'legacy') {
        return legacyAdapter.readLegacySnapshot();
      }
      if (guardedSelector.source === 'gamestate') {
        return projectGameStateForFrontOffice(await guardedSelector.read());
      }
      throw new Error('Unknown Front Office source');
    },
    liveWiringPrepared: true,
    automaticGameStateSelectionAllowed: false,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false
  });
}

module.exports = { createFrontOfficeLiveWiringBoundary };
