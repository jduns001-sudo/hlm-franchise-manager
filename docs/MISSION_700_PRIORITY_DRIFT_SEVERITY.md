# Mission 700: Priority baseline drift severity classification

Classifies read-only Mission 699 comparison findings into **critical** safety invariants, **high** diagnostic regressions (highest severity, severity counts, priority and urgent fields), **medium** ordering/count changes, and **low** metadata/other changes.

Exports `classifyPriorityBaselineDriftFinding(finding)` and `createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftSeverityReport(drift?)`. The report preserves the source finding order, adds stable `originalIndex`, records counts and highest severity, and detaches expected/actual arrays. It never authorizes simulation, mutates source data, or persists data.

Validation error codes: `INVALID_PRIORITY_BASELINE_DRIFT_FINDING` and `INVALID_PRIORITY_BASELINE_DRIFT_REPORT`.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-severity.test.js`. CI includes preceding diagnostic suites. No Front Office, Phase 10 demo, browser saves, gameplay or live franchise data changes.
