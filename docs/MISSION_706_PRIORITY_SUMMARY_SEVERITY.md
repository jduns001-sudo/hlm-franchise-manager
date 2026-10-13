# Mission 706: Priority summary drift severity

A deterministic, read-only classifier for Mission 705 priority summary drift findings.

Exports:
- `classifyPrioritySummaryDriftFinding(finding)`
- `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummarySeverityReport(drift?)`

Severity policy: **critical** for safety invariant flags, **high** for diagnostic/severity and priority/urgent field changes, **medium** for scenario/category ordering and counts, and **low** for metadata or other changes. Classification is advisory only and never authorizes simulation.

The report retains finding order, records original input indices, counts all severity levels, identifies highest severity, and detaches array-valued expected/actual fields. Invalid findings or reports raise named error codes.

Tests cover every category, clean and mixed drift, exact severity counts and order, deterministic results, mutation isolation, and malformed inputs. Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-severity.test.js`.

No Front Office, Phase 10 demo, browser saves, gameplay or live franchise data is changed.
