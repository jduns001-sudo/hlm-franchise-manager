# Mission 712: Priority summary baseline drift severity

Mission 712 classifies findings from the Mission 711 read-only drift report against the independently pinned Mission 710 baseline. It does not authorize simulation, write data or change gameplay.

Exports:
- `classifyPrioritySummaryPriorityDriftFinding(finding)`
- `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPrioritySeverityReport(drift?)`

Severity rules, in precedence order: safety invariant changes are **critical**; highest severity, severity counts, priority and urgent fields are **high** diagnostic regressions; scenario order, missing/duplicate scenarios, finding and category counts, category ordering and drift flags are **medium** ordering/count changes; remaining metadata changes are **low**.

The output contains baseline/matrix versions, exact severity counts, highest severity, finding count, hasDrift, and original-order findings with severity, category, scenario, field, code, detached expected/actual values and originalIndex. All safety flags remain false.

Tests verify clean default output, ten literal classification examples, a nine-finding mixed synthetic drift with exact 2 critical / 4 high / 2 medium / 1 low counts, input non-mutation, array isolation, repeatability and invalid input rejection.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-severity.test.js`.

This is advisory-only. No Front Office, Phase 10 demo, browser saves, gameplay or live franchise data changes.
