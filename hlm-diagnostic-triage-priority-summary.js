'use strict';

/**
 * Mission 683: deterministic, read-only grouping of Mission 682 findings.
 * Priority is advisory, never a permission to simulate or persist.
 */
const { createDiagnosticTriageDriftSeverityReport } = require('./hlm-diagnostic-triage-drift-severity');
const { SEVERITY_ORDER } = require('./hlm-diagnostic-drift-severity');

function createDiagnosticTriagePrioritySummary(severityReport = createDiagnosticTriageDriftSeverityReport()) {
  if (!severityReport || severityReport.kind !== 'franchise-diagnostic-triage-drift-severity-report' ||
      !Array.isArray(severityReport.findings) ||
      severityReport.findingCount !== severityReport.findings.length) {
    const error = new TypeError('A valid Mission 682 triage drift severity report is required');
    error.code = 'INVALID_TRIAGE_DRIFT_SEVERITY_REPORT';
    throw error;
  }
  const prioritized = severityReport.findings.map((finding, index) => {
    if (!finding || !SEVERITY_ORDER.includes(finding.severity) ||
        typeof finding.category !== 'string' || !finding.category ||
        typeof finding.field !== 'string' || typeof finding.code !== 'string') {
      const error = new TypeError('Invalid classified triage drift finding');
      error.code = 'INVALID_TRIAGE_CLASSIFIED_FINDING';
      throw error;
    }
    return {
      scenario: finding.scenario,
      field: finding.field,
      code: finding.code,
      expected: Array.isArray(finding.expected) ? finding.expected.slice() : finding.expected,
      actual: Array.isArray(finding.actual) ? finding.actual.slice() : finding.actual,
      severity: finding.severity,
      category: finding.category,
      originalIndex: index
    };
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
    group.findings.push({
      ...finding,
      expected: Array.isArray(finding.expected) ? finding.expected.slice() : finding.expected,
      actual: Array.isArray(finding.actual) ? finding.actual.slice() : finding.actual
    });
  }
  const groups = [...categories.values()].sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.highestSeverity) - SEVERITY_ORDER.indexOf(b.highestSeverity) ||
    a.category.localeCompare(b.category)
  );
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of prioritized) counts[finding.severity] += 1;
  const highestSeverity = SEVERITY_ORDER.find(level => counts[level] > 0) || null;
  return {
    kind: 'franchise-diagnostic-triage-priority-summary',
    version: 1,
    baselineVersion: severityReport.baselineVersion,
    findingCount: prioritized.length,
    hasDrift: prioritized.length > 0,
    highestSeverity,
    counts,
    categoryCount: groups.length,
    groups,
    priorityFindings: prioritized.filter(finding => finding.severity === highestSeverity).map(finding => ({
      ...finding,
      expected: Array.isArray(finding.expected) ? finding.expected.slice() : finding.expected,
      actual: Array.isArray(finding.actual) ? finding.actual.slice() : finding.actual
    })),
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = { createDiagnosticTriagePrioritySummary };
