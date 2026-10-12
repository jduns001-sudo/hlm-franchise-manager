'use strict';

/**
 * Mission 682: advisory severity classification of Mission 681 triage drift.
 * Never changes the fixture matrix, franchise data or simulation permissions.
 */
const { createDiagnosticTriageDriftReport } = require('./hlm-diagnostic-triage-drift-report');
const { SEVERITY_ORDER } = require('./hlm-diagnostic-drift-severity');

function classifyTriageDriftFinding(finding) {
  if (!finding || typeof finding !== 'object' || Array.isArray(finding) ||
      typeof finding.field !== 'string' || typeof finding.code !== 'string') {
    const error = new TypeError('A valid triage drift finding is required');
    error.code = 'INVALID_TRIAGE_DRIFT_FINDING';
    throw error;
  }
  const { field, code } = finding;
  if (code === 'TRIAGE_SAFETY_INVARIANT_CHANGED' ||
      ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed'].includes(field)) {
    return { severity: 'critical', category: 'safety-invariant' };
  }
  if (field === 'highestSeverity' || field.startsWith('severityCounts.') ||
      code === 'TRIAGE_SEVERITY_COUNT_CHANGED' || field === 'priorityFields' ||
      code === 'TRIAGE_PRIORITY_ORDER_CHANGED') {
    return { severity: 'high', category: 'diagnostic-regression' };
  }
  if (['driftCount', 'hasDrift', 'categoryCount', 'categoryNames', 'scenarioCount',
    'scenarioNames', 'scenario'].includes(field) ||
      ['TRIAGE_CATEGORY_ORDER_CHANGED', 'TRIAGE_SCENARIO_ORDER_CHANGED',
        'TRIAGE_SCENARIO_MISSING_OR_DUPLICATED'].includes(code)) {
    return { severity: 'medium', category: 'ordering-or-count' };
  }
  return { severity: 'low', category: 'metadata-or-other' };
}

function createDiagnosticTriageDriftSeverityReport(drift = createDiagnosticTriageDriftReport()) {
  if (!drift || drift.kind !== 'franchise-diagnostic-triage-drift-report' ||
      !Array.isArray(drift.findings) || drift.findingCount !== drift.findings.length) {
    const error = new TypeError('A valid Mission 681 triage drift report is required');
    error.code = 'INVALID_TRIAGE_DRIFT_REPORT';
    throw error;
  }
  const findings = drift.findings.map((finding, originalIndex) => ({
    scenario: finding.scenario,
    field: finding.field,
    code: finding.code,
    expected: Array.isArray(finding.expected) ? finding.expected.slice() : finding.expected,
    actual: Array.isArray(finding.actual) ? finding.actual.slice() : finding.actual,
    ...classifyTriageDriftFinding(finding),
    originalIndex
  }));
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return {
    kind: 'franchise-diagnostic-triage-drift-severity-report',
    version: 1,
    baselineVersion: drift.baselineVersion,
    findingCount: findings.length,
    hasDrift: findings.length > 0,
    highestSeverity: SEVERITY_ORDER.find(level => counts[level] > 0) || null,
    counts,
    findings,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { classifyTriageDriftFinding, createDiagnosticTriageDriftSeverityReport };
