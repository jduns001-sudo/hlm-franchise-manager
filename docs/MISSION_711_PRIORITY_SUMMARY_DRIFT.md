# Mission 711: Read-only priority summary baseline drift report

Mission 711 compares the synthetic Mission 709 fixture matrix with the independently pinned Mission 710 expected baseline. It is advisory-only and does not mutate source data, authorize simulation or persist data.

Export: `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityDriftReport(matrix?)`.

The report detects changes to matrix kind/version/scenario count, safety flags, scenario ordering, missing/duplicate scenarios, per-scenario drift state, finding count, highest severity, category count, all four severity counts, category order, highest-priority fields, urgent fields and row-level simulation authorization.

Findings are deterministic objects with `{scenario,field,expected,actual,code}`. Array values are detached from both source matrices and the frozen baseline. The report includes `hasDrift`, `findingCount`, `baselineVersion`, `matrixVersion` and all three safety flags set to false.

Tests pin a clean default report, 16 exact simultaneous synthetic deviations, missing/duplicate scenarios, malformed row values, invalid inputs, deterministic repeatability, detached arrays, and non-mutation. Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-drift-report.test.js`.

No Front Office, Phase 10 demo, browser saves, gameplay or live franchise data changes.
