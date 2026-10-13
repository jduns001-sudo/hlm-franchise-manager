# Mission 705: Priority summary drift report

Read-only comparison of the fictional Mission 703 priority summary fixture matrix against the independent, deeply frozen Mission 704 baseline.

`createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryDriftReport(matrix?)` accepts a detached fixture matrix or builds the default one. It detects metadata and safety-flag changes, scenario reordering, missing/duplicate scenarios, changed drift flags, finding/category counts, highest severity, per-level severity counts, category ordering, priority and urgent field changes, and row-level simulation authorization. Findings have `scenario`, `field`, `expected`, `actual`, and `code` properties, with array values detached.

Malformed matrix inputs throw `INVALID_PRIORITY_SUMMARY_FIXTURE_MATRIX`. Report safety flags are always false, and no simulation, mutation or persistence is performed.

Tests cover clean default output, 15 simultaneous synthetic deviations, exact finding codes/order, detached arrays, missing/duplicate scenarios, malformed row fields, and invalid input. Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-drift-report.test.js`.

This mission does not modify Front Office, Phase 10 demo, browser saves, gameplay, or live franchise data.
