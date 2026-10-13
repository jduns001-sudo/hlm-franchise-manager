# Mission 717: Read-only priority summary baseline drift comparison

Mission 717 compares the fictional Mission 715 fixture matrix against the independent, deeply frozen Mission 716 baseline. No live franchise state is read or modified, and simulation and persistence remain unauthorized.

Exports `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityDriftReport(matrix?)`. Omitting the argument uses a fresh Mission 715 matrix. Invalid matrices throw `INVALID_PRIORITY_SUMMARY_FINAL_FIXTURE_MATRIX`. Findings are deterministic, with `scenario`, `field`, `expected`, `actual`, and `code`; array values are detached.

Detected changes: matrix kind/version/scenario count, all three safety flags, scenario ordering, missing or duplicate expected scenarios, row drift status, finding count, highest severity, category count, four severity counts, category ordering, priority fields, urgent fields, and row simulation authorization. Findings are advisory only.

The report includes `kind`, `version: 1`, `baselineVersion`, `matrixVersion`, `hasDrift`, `findingCount`, `findings`, and fixed false `simulationAuthorized`, `sourceStateMutated`, and `persistencePerformed`.

Tests cover a clean comparison, sixteen simultaneous deviations, missing/duplicate scenarios, malformed row arrays, unknown scenarios, detached output, repeatability, input immutability, and invalid matrix inputs.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-drift-report.test.js`.

No changes to the Front Office, Phase 10 demo, browser saves, franchise data, or gameplay.
