'use strict';

const { auditDraftPickIdentity } = require('./hlm-draft-pick-identity');

function inspectDraftPickSources(universePicks = [], legacyPicks = []) {
  const universe = Array.isArray(universePicks) ? universePicks : [];
  const legacy = Array.isArray(legacyPicks) ? legacyPicks : [];
  const universeAudit = auditDraftPickIdentity(universe);
  const legacyAudit = auditDraftPickIdentity(legacy);

  // Existing Front Office behavior treats the legacy/imported collection as the
  // operational ownership overlay. Universe picks remain reference data.
  const operationalSource = legacy.length ? 'legacy' : 'universe-reference-only';

  return {
    operationalSource,
    universe: { count: universe.length, audit: universeAudit, role: 'reference' },
    legacy: { count: legacy.length, audit: legacyAudit, role: legacy.length ? 'operational-overlay' : 'absent' },
    permanentIdentityReady: legacy.length > 0 && legacyAudit.permanentIdentityReady,
    identityMigrationRequired: legacy.length > 0 && !legacyAudit.permanentIdentityReady,
    universePromotionAllowed: false
  };
}

module.exports = { inspectDraftPickSources };
