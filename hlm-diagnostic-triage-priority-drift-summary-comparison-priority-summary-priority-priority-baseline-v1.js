'use strict';

/**
 * Mission 716: independently pinned immutable expectations for Mission 715.
 * No fixture or report-generator imports: values are manually pinned.
 */
const pin = Object.freeze;
const counts = (critical, high, medium, low) => pin({ critical, high, medium, low });
const fields = (...values) => pin(values);

const PRIORITY_SUMMARY_FINAL_EXPECTED_BASELINE_V1 = pin({
  kind: 'franchise-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-expected-baseline',
  version: 1,
  matrixVersion: 1,
  scenarioNames: fields('clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'),
  expectations: pin({
    clean: pin({
      hasDrift: false, findingCount: 0, highestSeverity: null,
      severityCounts: counts(0, 0, 0, 0),
      categoryCount: 0, categoryNames: fields(),
      priorityFields: fields(), urgentFields: fields(), simulationAuthorized: false
    }),
    safetyViolation: pin({
      hasDrift: true, findingCount: 1, highestSeverity: 'critical',
      severityCounts: counts(1, 0, 0, 0),
      categoryCount: 1, categoryNames: fields('safety-invariant'),
      priorityFields: fields('simulationAuthorized'),
      urgentFields: fields('simulationAuthorized'), simulationAuthorized: false
    }),
    diagnosticRegression: pin({
      hasDrift: true, findingCount: 3, highestSeverity: 'high',
      severityCounts: counts(0, 3, 0, 0),
      categoryCount: 1, categoryNames: fields('diagnostic-regression'),
      priorityFields: fields('highestSeverity', 'severityCounts.high', 'priorityFields'),
      urgentFields: fields('highestSeverity', 'severityCounts.high', 'priorityFields'),
      simulationAuthorized: false
    }),
    orderingChange: pin({
      hasDrift: true, findingCount: 2, highestSeverity: 'medium',
      severityCounts: counts(0, 0, 2, 0),
      categoryCount: 1, categoryNames: fields('ordering-or-count'),
      priorityFields: fields('scenarioNames', 'categoryNames'),
      urgentFields: fields(), simulationAuthorized: false
    }),
    mixedPriority: pin({
      hasDrift: true, findingCount: 7, highestSeverity: 'critical',
      severityCounts: counts(1, 3, 2, 1),
      categoryCount: 4,
      categoryNames: fields('safety-invariant', 'diagnostic-regression',
        'ordering-or-count', 'metadata-or-other'),
      priorityFields: fields('simulationAuthorized'),
      urgentFields: fields('simulationAuthorized', 'highestSeverity',
        'severityCounts.high', 'priorityFields'),
      simulationAuthorized: false
    })
  }),
  simulationAuthorized: false,
  sourceStateMutated: false,
  persistencePerformed: false
});

module.exports = { PRIORITY_SUMMARY_FINAL_EXPECTED_BASELINE_V1 };
