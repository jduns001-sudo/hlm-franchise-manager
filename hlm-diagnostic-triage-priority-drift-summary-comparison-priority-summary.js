'use strict';

/**
 * Mission 701: advisory priority summary of Mission 700 classified findings.
 * Never authorizes simulation, mutates franchise state, or persists data.
 */
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySeverityReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-severity');
const { SEVERITY_ORDER } = require('./hlm-diagnostic-drift-severity');

const cloneFinding = finding => ({
  ...finding,
  expected: Array.isArray(finding.expected) ? finding.expected.slice() : finding.expected,
  actual: Array.isArray(finding.actual) ? finding.actual.slice() : finding.actual
});

function createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummary(
  severityReport = createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySeverityReport()
) {
  if (!severityReport ||
      severityReport.kind !== 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-severity-report' ||
      !Array.isArray(severityReport.findings) ||
      severityReport.findingCount !== severityReport.findings.length) {
    const error = new TypeError('A valid Mission 700 priority severity report is required');
    error.code = 'INVALID_PRIORITY_BASELINE_SEVERITY_REPORT';
    throw error;
  }
  const prioritized = severityReport.findings.map((finding, index) => {
    if (!finding || typeof finding !== 'object' || Array.isArray(finding) ||
        !SEVERITY_ORDER.includes(finding.severity) ||
        typeof finding.category !== 'string' || !finding.category.trim() ||
        typeof finding.field !== 'string' || typeof finding.code !== 'string') {
      const error = new TypeError('A valid classified priority baseline finding is required');
      error.code = 'INVALID_PRIORITY_BASELINE_CLASSIFIED_FINDING';
      throw error;
    }
    return { ...cloneFinding(finding), originalIndex: index };
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
    group.count++;
    group.counts[finding.severity]++;
    group.findings.push(cloneFinding(finding));
  }
  const groups = [...categories.values()].sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.highestSeverity) - SEVERITY_ORDER.indexOf(b.highestSeverity) ||
    (a.category < b.category ? -1 : a.category > b.category ? 1 : 0)
  );
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of prioritized) counts[finding.severity]++;
  const highestSeverity = SEVERITY_ORDER.find(level => counts[level] > 0) || null;

  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary',
    version: 1,
    baselineVersion: severityReport.baselineVersion,
    matrixVersion: severityReport.matrixVersion,
    findingCount: prioritized.length,
    hasDrift: prioritized.length > 0,
    highestSeverity,
    counts,
    categoryCount: groups.length,
    groups,
    priorityFindings: prioritized.filter(finding => finding.severity === highestSeverity).map(cloneFinding),
    urgentFindings: prioritized.filter(finding => finding.severity === 'critical' || finding.severity === 'high').map(cloneFinding),
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummary };
