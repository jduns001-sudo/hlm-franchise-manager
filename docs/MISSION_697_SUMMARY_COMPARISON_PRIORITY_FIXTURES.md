# Mission 697: Priority report regression fixture matrix

Creates five **fictional, read-only** scenarios for the Mission 695 priority report: `clean`, `safetyViolation`, `diagnosticRegression`, `orderingChange`, and `mixedPriority`. The inputs are fresh, detached mutations of the synthetic Mission 691 matrix, not live franchise records.

The pipeline runs Mission 693 comparison, Mission 694 severity classification, and Mission 695 prioritization. The resulting matrix contains one row per scenario with drift state, finding count, highest severity, severity counts, category names, highest-priority fields and all critical/high urgent fields. Scenario order is fixed, and safety flags remain false in outputs even when a fictional input intentionally violates one.

Exports `SUMMARY_COMPARISON_PRIORITY_SCENARIO_NAMES`, `createSummaryComparisonPriorityScenarioInput(name)`, and `createDiagnosticTriagePriorityDriftSummaryComparisonPriorityFixtureMatrix()`.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-fixture-matrix.test.js`. CI includes preceding diagnostic suites. No Front Office, Phase 10 demo, browser saves, gameplay, or live data changes.
