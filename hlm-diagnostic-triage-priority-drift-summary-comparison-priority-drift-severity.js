'use strict';

/**
 * Mission 700: read-only classification of Mission 699 priority baseline drift.
 * Severity is advisory and never grants simulation or persistence permission.
 */
const { createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report');
const { SEVERITY_ORDER } = require('./hlm-diagnostic-drift-severity');

function classifyPriorityBaselineDriftFinding(finding) {
  if (!finding || typeof finding !== 'object' || Array.isArray(finding) ||
      typeof finding.field !== 'string' || typeof finding.code !== 'string') {
    const error = new TypeError('A valid Mission 699 priority baseline finding is required');
    error.code = 'INVALID_PRIORITY_BASELINE_DRIFT_FINDING';
    throw error;
  }
  const { field, code } = finding;
  if (code === 'PRIORITY_SAFETY_INVARIANT_CHANGED' ||
      ['simulationAuthorized', 'sourceStateMutated', 'persistencePerformed'].includes(field)) {
    return { severity: 'critical', category: 'safety-invariant' };
  }
  if (field === 'highestSeverity' || field.startsWith('severityCounts.') ||
      ['priorityFields', 'urgentFields'].includes(field) ||
      ['PRIORITY_SEVERITY_COUNT_CHANGED', 'PRIORITY_FIELDS_CHANGED',
        'PRIORITY_URGENT_FIELDS_CHANGED'].includes(code)) {
    return { severity: 'high', category: 'diagnostic-regression' };
  }
  if (['hasDrift', 'findingCount', 'categoryCount', 'categoryNames',
    'scenarioCount', 'scenarioNames', 'scenario'].includes(field) ||
      ['PRIORITY_CATEGORY_ORDER_CHANGED', 'PRIORITY_SCENARIO_ORDER_CHANGED',
        'PRIORITY_SCENARIO_MISSING_OR_DUPLICATED'].includes(code)) {
    return { severity: 'medium', category: 'ordering-or-count' };
  }
  return { severity: 'low', category: 'metadata-or-other' };
}

function createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftSeverityReport(
  drift = createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport()
) {
  if (!drift ||
      drift.kind !== 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report' ||
      !Array.isArray(drift.findings) ||
      drift.findingCount !== drift.findings.length) {
    const error = new TypeError('A valid Mission 699 priority baseline drift report is required');
    error.code = 'INVALID_PRIORITY_BASELINE_DRIFT_REPORT';
    throw error;
  }
  const findings = drift.findings.map((finding, originalIndex) => ({
    scenario: finding.scenario,
    field: finding.field,
    code: finding.code,
    expected: Array.isArray(finding.expected) ? finding.expected.slice() : finding.expected,
    actual: Array.isArray(finding.actual) ? finding.actual.slice() : finding.actual,
    ...classifyPriorityBaselineDriftFinding(finding),
    originalIndex
  }));
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) counts[finding.severity]++;
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-drift-severity-report',
    version: 1,
    baselineVersion: drift.baselineVersion,
    matrixVersion: drift.matrixVersion,
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

module.exports = {
  classifyPriorityBaselineDriftFinding,
  createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftSeverityReport
};
