'use strict';

/** Mission 715: fictional, fresh, read-only regression inputs for Mission 713. */
const { createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityReport } =
  require('./hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-report');

const PRIORITY_SUMMARY_FINAL_SCENARIO_NAMES = Object.freeze([
  'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
]);
const INPUT_KIND = 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-severity-report';
const makeFinding = (severity, category, field) => ({
  severity, category, field, scenario: 'fictional', code: 'SYNTHETIC_' + field,
  expected: ['before-' + field], actual: ['after-' + field]
});
const safety = () => makeFinding('critical', 'safety-invariant', 'simulationAuthorized');
const diagnostic = () => [
  makeFinding('high', 'diagnostic-regression', 'highestSeverity'),
  makeFinding('high', 'diagnostic-regression', 'severityCounts.high'),
  makeFinding('high', 'diagnostic-regression', 'priorityFields')
];
const ordering = () => [
  makeFinding('medium', 'ordering-or-count', 'scenarioNames'),
  makeFinding('medium', 'ordering-or-count', 'categoryNames')
];
function createPrioritySummaryFinalScenarioInput(name) {
  if (!PRIORITY_SUMMARY_FINAL_SCENARIO_NAMES.includes(name)) {
    const error = new RangeError('Unknown Mission 715 scenario: ' + name);
    error.code = 'UNKNOWN_PRIORITY_SUMMARY_FINAL_SCENARIO';
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
        makeFinding('low', 'metadata-or-other', 'version'),
        ...ordering(),
        ...diagnostic(),
        safety()
      ];
      break;
  }
  return {
    kind: INPUT_KIND,
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
function createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityFixtureMatrix() {
  const rows = PRIORITY_SUMMARY_FINAL_SCENARIO_NAMES.map(scenario => {
    const report = createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityReport(
      createPrioritySummaryFinalScenarioInput(scenario)
    );
    return {
      scenario,
      hasDrift: report.hasDrift,
      findingCount: report.findingCount,
      highestSeverity: report.highestSeverity,
      severityCounts: { ...report.counts },
      categoryCount: report.categoryCount,
      categoryNames: report.groups.map(group => group.category),
      priorityFields: report.priorityFindings.map(finding => finding.field),
      urgentFields: report.urgentFindings.map(finding => finding.field),
      simulationAuthorized: false
    };
  });
  return {
    kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-fixture-matrix',
    version: 1,
    scenarioCount: rows.length,
    rows,
    simulationAuthorized: false,
    sourceStateMutated: false,
    persistencePerformed: false
  };
}
module.exports = {
  PRIORITY_SUMMARY_FINAL_SCENARIO_NAMES,
  createPrioritySummaryFinalScenarioInput,
  createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityFixtureMatrix
};
