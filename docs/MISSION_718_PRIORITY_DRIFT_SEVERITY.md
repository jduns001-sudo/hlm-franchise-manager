# Mission 718: Read-only severity classification

Mission 718 classifies Mission 717 baseline drift findings without accessing or modifying franchise state, gameplay, persistence, browser saves or the Front Office.

Exports:
- `classifyPrioritySummaryFinalDriftFinding(finding)`
- `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPrioritySeverityReport(drift?)`

| Severity | Category | Trigger |
| --- | --- | --- |
| critical | safety-invariant | Safety invariant code or simulationAuthorized, sourceStateMutated, persistencePerformed fields |
| high | diagnostic-regression | highestSeverity, severityCounts.*, priorityFields, urgentFields, corresponding diagnostic codes |
| medium | ordering-or-count | hasDrift, findingCount, categoryCount, categoryNames, scenarioCount, scenarioNames, scenario, corresponding ordering codes |
| low | metadata-or-other | Remaining metadata differences |

The report preserves original finding order and indices; copies expected and actual arrays; returns exact severity counts and highest severity; and fixes all three safety flags to false. Invalid findings and drift reports throw stable error codes.

Tests pin clean behavior, classification examples, nine synthetic drift findings with expected counts (critical 2, high 4, medium 2, low 1), original ordering, detached arrays, repeatability, and invalid input handling.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-severity.test.js`.

No Front Office, Phase 10 demo, browser save, franchise data, simulation or gameplay changes.
