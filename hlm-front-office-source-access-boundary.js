'use strict';

function createFrontOfficeSourceAccessBoundary(options = {}) {
  const legacyAdapter = options.legacyAdapter;
  const selector = options.selector || null;

  if (!legacyAdapter || legacyAdapter.kind !== 'front-office-read-only-runtime-adapter' ||
      typeof legacyAdapter.readLegacySnapshot !== 'function') {
    throw new TypeError('Read-only Front Office legacy adapter is required');
  }

  if (selector && (selector.kind !== 'reversible-front-office-source-selector' ||
      typeof selector.read !== 'function')) {
    throw new TypeError('Valid reversible Front Office source selector is required');
  }

  return Object.freeze({
    kind: 'front-office-source-access-boundary',
    version: 1,
    get source() {
      return selector ? selector.source : 'legacy';
    },
    get selectorAttached() {
      return selector !== null;
    },
    async read() {
      if (!selector) return legacyAdapter.readLegacySnapshot();
      return selector.read();
    },
    frontOfficeActivationAllowed: false,
    automaticGameStateSelectionAllowed: false,
    persistenceWriteAllowed: false,
    legacySourceDeletionAllowed: false,
    liveFrontOfficeWiringPerformed: false
  });
}

module.exports = { createFrontOfficeSourceAccessBoundary };
