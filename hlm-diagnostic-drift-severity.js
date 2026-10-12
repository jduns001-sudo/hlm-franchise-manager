'use strict';

/**
 * Mission 676: read-only triage of Mission 675 drift findings.
 * Severity is advisory, not a permission to simulate or mutate game state.
 */
const { createFranchiseDiagnosticDriftReport } = require('./hlm-franchise-diagnostic-drift-report');

const SEVERITY_ORDER = Object.freeze(['critical', 'high', 'medium', 'low']);

function classifyDriftFinding(change) {
  if (!change || typeof change !== 'object') {
    const error = new TypeError('A drift finding is required');
    error.code = 'INVALID_DRIFT_FINDING';
    throw error;
  }
  const { code, field, expected } = change;
  if (code === 'SIMULATION_AUTHORIZATION_CHANGED' || field === 'simulationAuthorized' ||
      field === 'sourceStateMutated' || field === 'persistencePerformed') {
    return { severity: 'critical', category: 'safety-invariant' };
  }
  if (code === 'REQUIRED_DIAGNOSTIC_MISSING' && field === 'errorCodes') {
    return { severity: 'high', category: 'canonical-diagnostic' };
  }
  if (field === 'dataQualityValid' || field === 'unresolvedPlayerCount' ||
      field === 'unresolvedOrganizationWarningCount' ||
      (code === 'REQUIRED_DIAGNOSTIC_MISSING' && field === 'readinessWarningCodes')) {
    return { severity: 'high', category: 'data-quality-or-organization' };
  }
  if (field === 'candidateCount' || field === 'teamCount' || field === 'fixtureCount' ||
      code === 'FIXTURE_MISSING_OR_DUPLICATED' || code === 'FIXTURE_ORDER_CHANGED') {
    return { severity: 'medium', category: 'roster-or-fixture' };
  }
  return { severity: 'low', category: 'metadata-or-other' };
}

function createDiagnosticDriftSeverityReport(drift = createFranchiseDiagnosticDriftReport()) {
  if (!drift || drift.kind !== 'franchise-diagnostic-drift-report' ||
      !Array.isArray(drift.changes) || drift.changeCount !== drift.changes.length) {
    const error = new TypeError('A valid Mission 675 drift report is required');
    error.code = 'INVALID_DRIFT_REPORT';
    throw error;
  }
  const findings = drift.changes.map(change => ({
    fixture: change.fixture,
    field: change.field,
    code: change.code,
    expected: Array.isArray(change.expected) ? change.expected.slice() : change.expected,
    actual: Array.isArray(change.actual) ? change.actual.slice() : change.actual,
    ...classifyDriftFinding(change)
  }));
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return {
    kind: 'franchise-diagnostic-drift-severity-report',
    version: 1,
    baselineVersion: drift.baselineVersion,
    findingCount: findings.length,
    hasDrift: findings.length > 0,
    highestSeverity: SEVERITY_ORDER.find(severity => counts[severity] > 0) || null,
    counts,
    findings,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { classifyDriftFinding, createDiagnosticDriftSeverityReport, SEVERITY_ORDER };
