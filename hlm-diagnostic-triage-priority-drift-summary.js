'use strict';

/**
 * Mission 689: advisory, deterministic grouping of Mission 688 severity findings.
 * Never changes source diagnostics or authorizes simulation/persistence.
 */
const { createDiagnosticTriagePriorityDriftSeverityReport } = require('./hlm-diagnostic-triage-priority-drift-severity');
const { SEVERITY_ORDER } = require('./hlm-diagnostic-drift-severity');

function createDiagnosticTriagePriorityDriftSummary(
  severityReport = createDiagnosticTriagePriorityDriftSeverityReport()
) {
  if (!severityReport ||
      severityReport.kind !== 'franchise-diagnostic-triage-priority-drift-severity-report' ||
      !Array.isArray(severityReport.findings) ||
      severityReport.findingCount !== severityReport.findings.length) {
    const error = new TypeError('A valid Mission 688 priority drift severity report is required');
    error.code = 'INVALID_PRIORITY_DRIFT_SEVERITY_REPORT';
    throw error;
  }
  const clone = finding => ({
    ...finding,
    expected: Array.isArray(finding.expected) ? finding.expected.slice() : finding.expected,
    actual: Array.isArray(finding.actual) ? finding.actual.slice() : finding.actual
  });
  const prioritized = severityReport.findings.map((finding, originalIndex) => {
    if (!finding || !SEVERITY_ORDER.includes(finding.severity) ||
        typeof finding.category !== 'string' || !finding.category ||
        typeof finding.field !== 'string' || typeof finding.code !== 'string') {
      const error = new TypeError('A valid classified priority drift finding is required');
      error.code = 'INVALID_PRIORITY_CLASSIFIED_FINDING';
      throw error;
    }
    return { ...clone(finding), originalIndex };
  }).sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
    a.originalIndex - b.originalIndex
  );
  const categories = new Map();
  for (const finding of prioritized) {
    if (!categories.has(finding.category)) {
      categories.set(finding.category, {
        category: finding.category,
        count: 0,
        highestSeverity: finding.severity,
        counts: { critical: 0, high: 0, medium: 0, low: 0 },
        findings: []
      });
    }
    const group = categories.get(finding.category);
    group.count += 1;
    group.counts[finding.severity] += 1;
    group.findings.push(clone(finding));
  }
  const groups = [...categories.values()].sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.highestSeverity) - SEVERITY_ORDER.indexOf(b.highestSeverity) ||
    a.category.localeCompare(b.category)
  );
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of prioritized) counts[finding.severity] += 1;
  const highestSeverity = SEVERITY_ORDER.find(level => counts[level] > 0) || null;
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary',
    version: 1,
    baselineVersion: severityReport.baselineVersion,
    matrixVersion: severityReport.matrixVersion,
    findingCount: prioritized.length,
    hasDrift: prioritized.length > 0,
    highestSeverity,
    counts,
    categoryCount: groups.length,
    groups,
    priorityFindings: prioritized.filter(finding => finding.severity === highestSeverity).map(clone),
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createDiagnosticTriagePriorityDriftSummary };
