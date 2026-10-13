# Mission 693: Priority drift summary baseline comparison

This read-only report compares the fictional Mission 691 fixture matrix against the independently pinned Mission 692 baseline. Entry point: `createDiagnosticTriagePriorityDriftSummaryComparisonReport(matrix?)`.

It reports deterministic findings `{scenario, field, expected, actual, code}` for metadata, scenario order, missing or duplicated scenarios, severity counts, category ordering, priority fields, and top-level or per-row safety invariant drift. Default input is a freshly generated fictional fixture matrix. The report never authorizes simulation, mutates source records, or persists state.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-report.test.js`. The test covers clean and mutated matrices, expected finding ordering and codes, duplicate/missing scenarios, invalid input, detachment and repeatability. CI runs this and earlier diagnostic suites.

No Front Office, Phase 10 demo, browser saves, gameplay or live franchise data changes.
