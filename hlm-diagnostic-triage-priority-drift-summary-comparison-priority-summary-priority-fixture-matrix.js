'use strict';

/** Mission 709: fresh fictional scenarios exercising Mission 707, without live data. */
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-report');

const PRIORITY_SUMMARY_PRIORITY_SCENARIO_NAMES = Object.freeze([
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);

const reportKind = 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-severity-report';
const finding = (severity, category, field) => ({
  severity, category, field, code: 'SYNTHETIC_' + field,
  scenario: 'fictional', expected: ['before-' + field], actual: ['after-' + field]
});
const safety = () => finding('critical', 'safety-invariant', 'simulationAuthorized');
const diagnostic = () => [
  finding('high', 'diagnostic-regression', 'highestSeverity'),
  finding('high', 'diagnostic-regression', 'severityCounts.high'),
  finding('high', 'diagnostic-regression', 'priorityFields')
];
const ordering = () => [
  finding('medium', 'ordering-or-count', 'scenarioNames'),
  finding('medium', 'ordering-or-count', 'categoryNames')
];

function createPrioritySummaryPriorityScenarioInput(name) {
  if (!PRIORITY_SUMMARY_PRIORITY_SCENARIO_NAMES.includes(name)) {
    const error = new RangeError('Unknown priority summary priority scenario: ' + name);
    error.code = 'UNKNOWN_PRIORITY_SUMMARY_PRIORITY_SCENARIO';
    throw error;
  }
  let findings;
  switch (name) {
    case 'clean': findings = []; break;
    case 'safetyViolation': findings = [safety()]; break;
    case 'diagnosticRegression': findings = diagnostic(); break;
    case 'orderingChange': findings = ordering(); break;
    case 'mixedPriority':
      findings = [
        finding('low', 'metadata-or-other', 'version'),
        ...ordering(),
        ...diagnostic(),
        safety()
      ];
      break;
  }
  return {
    kind: reportKind,
    version: 1,
    baselineVersion: 1,
    matrixVersion: 1,
    findingCount: findings.length,
    findings,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

function createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix() {
  const rows = PRIORITY_SUMMARY_PRIORITY_SCENARIO_NAMES.map(scenario => {
    const input = createPrioritySummaryPriorityScenarioInput(scenario);
    const report = createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityReport(input);
    return {
      scenario,
      hasDrift: report.hasDrift,
      findingCount: report.findingCount,
      highestSeverity: report.highestSeverity,
      severityCounts: { ...report.counts },
      categoryCount: report.categoryCount,
      categoryNames: report.groups.map(group => group.category),
      priorityFields: report.priorityFindings.map(item => item.field),
      urgentFields: report.urgentFindings.map(item => item.field),
      simulationAuthorized: false
    };
  });
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix',
    version: 1,
    scenarioCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}

module.exports = {
  PRIORITY_SUMMARY_PRIORITY_SCENARIO_NAMES,
  createPrioritySummaryPriorityScenarioInput,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix
};
