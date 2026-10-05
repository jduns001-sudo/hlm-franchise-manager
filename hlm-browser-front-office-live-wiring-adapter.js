'use strict';

const LEGACY_FRONT_OFFICE_STORAGE_KEY = 'hlm_tracker_v3';

function createBrowserFrontOfficeLiveWiringAdapter(options = {}) {
  const storage = options.storage;
  const liveWiringBoundary = options.liveWiringBoundary;

  if (!storage || typeof storage.getItem !== 'function') {
    throw new TypeError('Web Storage-compatible storage is required');
  }
  if (!liveWiringBoundary ||
      liveWiringBoundary.kind !== 'front-office-live-wiring-boundary' ||
      typeof liveWiringBoundary.readFrontOfficeSnapshot !== 'function') {
    throw new TypeError('Front Office live wiring boundary is required');
  }

  async function readLegacySnapshot() {
    const raw = storage.getItem(LEGACY_FRONT_OFFICE_STORAGE_KEY);
    if (raw == null) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      const e = new Error('Legacy Front Office state is not valid JSON');
      e.code = 'INVALID_LEGACY_FRONT_OFFICE_STATE';
      throw e;
    }
  }

  return Object.freeze({
    kind: 'browser-front-office-live-wiring-adapter',
    version: 1,
    legacyStorageKey: LEGACY_FRONT_OFFICE_STORAGE_KEY,
    defaultSource: 'legacy',
    get source() { return liveWiringBoundary.source; },
    readLegacySnapshot,
    async readSnapshot() {
      if (liveWiringBoundary.source === 'legacy') return readLegacySnapshot();
      return liveWiringBoundary.readFrontOfficeSnapshot();
    },
    automaticGameStateSelectionAllowed: false,
    browserStartupCutoverAllowed: false,
    frontOfficeActivationAllowed: false,
    frontOfficeActivationPerformed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false
  });
}

module.exports = {
  LEGACY_FRONT_OFFICE_STORAGE_KEY,
  createBrowserFrontOfficeLiveWiringAdapter
};
