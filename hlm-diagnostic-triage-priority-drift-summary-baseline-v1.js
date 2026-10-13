'use strict';

/**
 * Mission 692: independent, immutable expectations for Mission 691.
 * Do not import or execute the runtime fixture generator in this baseline.
 */
const pin = value => Object.freeze(value);
const counts = (critical, high, medium, low) => pin({ critical, high, medium, low });

const PRIORITY_DRIFT_SUMMARY_EXPECTED_BASELINE_V1 = pin({
  kind: 'franchise-diagnostic-triage-priority-drift-summary-expected-baseline',
  version: 1,
  matrixVersion: 1,
  scenarioNames: pin([
    'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
  ]),
  expectations: pin({
    clean: pin({
      hasDrift: false, findingCount: 0, highestSeverity: null,
      severityCounts: counts(0, 0, 0, 0),
      categoryCount: 0, categoryNames: pin([]), priorityFields: pin([]),
      simulationAuthorized: false
    }),
    safetyViolation: pin({
      hasDrift: true, findingCount: 1, highestSeverity: 'critical',
      severityCounts: counts(1, 0, 0, 0),
      categoryCount: 1, categoryNames: pin(['safety-invariant']),
      priorityFields: pin(['simulationAuthorized']), simulationAuthorized: false
    }),
    diagnosticRegression: pin({
      hasDrift: true, findingCount: 3, highestSeverity: 'high',
      severityCounts: counts(0, 3, 0, 0),
      categoryCount: 1, categoryNames: pin(['diagnostic-regression']),
      priorityFields: pin(['highestSeverity', 'severityCounts.high', 'priorityFields']),
      simulationAuthorized: false
    }),
    orderingChange: pin({
      hasDrift: true, findingCount: 1, highestSeverity: 'medium',
      severityCounts: counts(0, 0, 1, 0),
      categoryCount: 1, categoryNames: pin(['ordering-or-count']),
      priorityFields: pin(['scenarioNames']), simulationAuthorized: false
    }),
    mixedPriority: pin({
      hasDrift: true, findingCount: 6, highestSeverity: 'critical',
      severityCounts: counts(1, 3, 1, 1),
      categoryCount: 4,
      categoryNames: pin([
        'safety-invariant', 'diagnostic-regression', 'ordering-or-count', 'metadata-or-other'
      ]),
      priorityFields: pin(['simulationAuthorized']), simulationAuthorized: false
    })
  }),
  simulationAuthorized: false,
  sourceStateMutated: false,
  persistencePerformed: false
});

module.exports = { PRIORITY_DRIFT_SUMMARY_EXPECTED_BASELINE_V1 };
