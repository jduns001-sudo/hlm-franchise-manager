'use strict';

/**
 * Mission 686: independently pinned, immutable expectations for Mission 685.
 * Never import the runtime fixture generator into this baseline.
 */
function pin(values) { return Object.freeze(values); }

const PRIORITY_EXPECTED_BASELINE_V1 = pin({
  kind: 'franchise-diagnostic-triage-priority-expected-baseline',
  version: 1,
  matrixVersion: 1,
  scenarioNames: pin([
    'clean', 'safetyViolation', 'diagnosticRegression', 'orderingChange', 'mixedPriority'
  ]),
  expectations: pin({
    clean: pin({
      hasDrift: false, findingCount: 0, highestSeverity: null,
      severityCounts: pin({ critical: 0, high: 0, medium: 0, low: 0 }),
      categoryCount: 0, categoryNames: pin([]), priorityFields: pin([]),
      simulationAuthorized: false
    }),
    safetyViolation: pin({
      hasDrift: true, findingCount: 1, highestSeverity: 'critical',
      severityCounts: pin({ critical: 1, high: 0, medium: 0, low: 0 }),
      categoryCount: 1, categoryNames: pin(['safety-invariant']),
      priorityFields: pin(['simulationAuthorized']), simulationAuthorized: false
    }),
    diagnosticRegression: pin({
      hasDrift: true, findingCount: 2, highestSeverity: 'high',
      severityCounts: pin({ critical: 0, high: 2, medium: 0, low: 0 }),
      categoryCount: 1, categoryNames: pin(['diagnostic-regression']),
      priorityFields: pin(['highestSeverity', 'severityCounts.high']), simulationAuthorized: false
    }),
    orderingChange: pin({
      hasDrift: true, findingCount: 1, highestSeverity: 'medium',
      severityCounts: pin({ critical: 0, high: 0, medium: 1, low: 0 }),
      categoryCount: 1, categoryNames: pin(['ordering-or-count']),
      priorityFields: pin(['categoryNames']), simulationAuthorized: false
    }),
    mixedPriority: pin({
      hasDrift: true, findingCount: 5, highestSeverity: 'critical',
      severityCounts: pin({ critical: 1, high: 2, medium: 1, low: 1 }),
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

module.exports = { PRIORITY_EXPECTED_BASELINE_V1 };
