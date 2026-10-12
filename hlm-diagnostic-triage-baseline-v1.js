'use strict';

/**
 * Mission 680: independently pinned expected results for six fictional
 * diagnostic triage scenarios. Do not derive these values from runtime output.
 */
const TRIAGE_EXPECTED_BASELINE_V1 = Object.freeze({
  kind: 'franchise-diagnostic-triage-expected-baseline',
  version: 1,
  matrixVersion: 1,
  scenarioNames: Object.freeze([
    'clean', 'simulationAuthorization', 'missingCanonicalDiagnostic',
    'rosterCountChange', 'metadataVersionChange', 'mixedPriority'
  ]),
  expectations: Object.freeze({
    clean: Object.freeze({
      hasDrift: false, driftCount: 0, highestSeverity: null,
      severityCounts: Object.freeze({ critical: 0, high: 0, medium: 0, low: 0 }),
      categoryNames: Object.freeze([]),
      priorityFields: Object.freeze([])
    }),
    simulationAuthorization: Object.freeze({
      hasDrift: true, driftCount: 1, highestSeverity: 'critical',
      severityCounts: Object.freeze({ critical: 1, high: 0, medium: 0, low: 0 }),
      categoryNames: Object.freeze(['safety-invariant']),
      priorityFields: Object.freeze(['simulationAuthorized'])
    }),
    missingCanonicalDiagnostic: Object.freeze({
      hasDrift: true, driftCount: 3, highestSeverity: 'high',
      severityCounts: Object.freeze({ critical: 0, high: 3, medium: 0, low: 0 }),
      categoryNames: Object.freeze(['canonical-diagnostic']),
      priorityFields: Object.freeze(['errorCodes', 'errorCodes', 'errorCodes'])
    }),
    rosterCountChange: Object.freeze({
      hasDrift: true, driftCount: 1, highestSeverity: 'medium',
      severityCounts: Object.freeze({ critical: 0, high: 0, medium: 1, low: 0 }),
      categoryNames: Object.freeze(['roster-or-fixture']),
      priorityFields: Object.freeze(['candidateCount'])
    }),
    metadataVersionChange: Object.freeze({
      hasDrift: true, driftCount: 1, highestSeverity: 'low',
      severityCounts: Object.freeze({ critical: 0, high: 0, medium: 0, low: 1 }),
      categoryNames: Object.freeze(['metadata-or-other']),
      priorityFields: Object.freeze(['version'])
    }),
    mixedPriority: Object.freeze({
      hasDrift: true, driftCount: 6, highestSeverity: 'critical',
      severityCounts: Object.freeze({ critical: 1, high: 3, medium: 1, low: 1 }),
      categoryNames: Object.freeze([
        'safety-invariant', 'canonical-diagnostic', 'roster-or-fixture', 'metadata-or-other'
      ]),
      priorityFields: Object.freeze(['simulationAuthorized'])
    })
  }),
  simulationAuthorized: false,
  sourceStateMutated: false,
  persistencePerformed: false
});

module.exports = { TRIAGE_EXPECTED_BASELINE_V1 };
