'use strict';

function evaluateReadOnlyRuntimeReadiness(summary) {
  const blockers = [];
  if (!summary || typeof summary !== 'object') {
    return Object.freeze({ ready: false, blockers: Object.freeze(['Session summary is required']) });
  }
  if (summary.readOnly !== true) blockers.push('Session summary is not marked read-only');
  if (summary.persistenceEnabled !== false) blockers.push('Persistence must remain disabled');
  if (summary.compatible !== true) blockers.push('Runtime compatibility gate did not pass');
  if (summary.sourceSchema !== 7) blockers.push('Front Office schema 7 is required');
  if (Number(summary.blockerCount || 0) > 0) blockers.push('Snapshot audit contains blockers');

  return Object.freeze({
    kind: 'front-office-readonly-readiness-gate',
    version: 1,
    ready: blockers.length === 0,
    readOnly: true,
    persistenceEnabled: false,
    sourceSchema: summary.sourceSchema == null ? null : summary.sourceSchema,
    warningCount: Number(summary.warningCount || 0),
    blockerCount: Number(summary.blockerCount || 0),
    blockers: Object.freeze(blockers)
  });
}

module.exports = { evaluateReadOnlyRuntimeReadiness };
