# Mission 709: Priority summary regression fixture matrix

Mission 709 adds five **fictional, deterministic, read-only** scenarios for the Mission 707 priority report. These scenarios are synthetic Mission 706-shaped inputs, not real franchise records or saved data.

Scenarios: `clean`, `safetyViolation`, `diagnosticRegression`, `orderingChange`, `mixedPriority`.

The module exports `PRIORITY_SUMMARY_PRIORITY_SCENARIO_NAMES`, `createPrioritySummaryPriorityScenarioInput(name)`, and `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityFixtureMatrix()`. Each invocation creates fresh objects and detached rows.

Expected counts (critical, high, medium, low):
- clean: 0, 0, 0, 0
- safetyViolation: 1, 0, 0, 0
- diagnosticRegression: 0, 3, 0, 0
- orderingChange: 0, 0, 2, 0
- mixedPriority: 1, 3, 2, 1

The tests independently pin exact output rows including ordered category names, priority fields, urgent fields, highest severity, count totals, deterministic repeatability, fresh inputs, mutation isolation, and safety flags. Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-fixture-matrix.test.js`.

This is advisory verification only. No simulation authorization, persistence, Front Office, Phase 10 demo, browser save, live franchise data, or gameplay change is included.
