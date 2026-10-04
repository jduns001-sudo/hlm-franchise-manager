'use strict';

function summarizeFrontOfficeSession(inspection) {
  if (!inspection || typeof inspection !== 'object') {
    throw new TypeError('Runtime session inspection is required');
  }
  const counts = inspection.audit && inspection.audit.counts ? inspection.audit.counts : {};
  const state = inspection.snapshot && inspection.snapshot.state ? inspection.snapshot.state : {};
  const settings = state.settings || {};

  return Object.freeze({
    kind: 'front-office-readonly-session-summary',
    version: 1,
    readOnly: true,
    persistenceEnabled: false,
    compatible: inspection.compatible === true,
    sourceSchema: inspection.compatibility ? inspection.compatibility.sourceSchema : null,
    controlledTeamId: settings.controlledTeamId == null ? null : settings.controlledTeamId,
    counts: Object.freeze({
      players: Number(counts.players || 0),
      teams: Number(counts.teams || 0),
      contracts: Number(counts.contracts || 0),
      transactions: Number(counts.transactions || 0),
      draftPicks: Number(counts.draftPicks || 0),
      prospects: Number(counts.prospects || 0)
    }),
    warningCount: inspection.audit && inspection.audit.warnings ? inspection.audit.warnings.length : 0,
    blockerCount: inspection.audit && inspection.audit.blockers ? inspection.audit.blockers.length : 0,
    compatibilityReasons: Object.freeze(
      inspection.compatibility && inspection.compatibility.reasons
        ? Array.from(inspection.compatibility.reasons)
        : []
    )
  });
}

module.exports = { summarizeFrontOfficeSession };
