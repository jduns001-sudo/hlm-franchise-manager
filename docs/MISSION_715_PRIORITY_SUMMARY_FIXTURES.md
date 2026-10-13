# Mission 715: Fictional priority summary regression fixture matrix

Mission 715 adds five read-only, fictional scenarios for the Mission 713 priority report. It does not read or mutate live franchise data and does not authorize simulation or persistence.

Exports:
- `PRIORITY_SUMMARY_FINAL_SCENARIO_NAMES` (frozen ordered names)
- `createPrioritySummaryFinalScenarioInput(name)` (fresh detached synthetic severity input)
- `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityFixtureMatrix()` (fresh detached matrix)

| Scenario | Critical | High | Medium | Low | Categories | Priority fields | Urgent fields |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| clean | 0 | 0 | 0 | 0 | 0 | none | none |
| safetyViolation | 1 | 0 | 0 | 0 | 1 | simulationAuthorized | simulationAuthorized |
| diagnosticRegression | 0 | 3 | 0 | 0 | 1 | highestSeverity, severityCounts.high, priorityFields | same three |
| orderingChange | 0 | 0 | 2 | 0 | 1 | scenarioNames, categoryNames | none |
| mixedPriority | 1 | 3 | 2 | 1 | 4 | simulationAuthorized | simulationAuthorized, highestSeverity, severityCounts.high, priorityFields |

Tests pin exact scenario order, all counts, highest severity, group category ordering, priority and urgent fields, safety flags, invalid names, repeatability, and detached input/matrix outputs.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-fixture-matrix.test.js`.

No Front Office, Phase 10 demo, browser save, gameplay, or production report logic changes.
