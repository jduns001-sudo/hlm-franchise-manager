# Mission 691: Priority drift summary regression fixture matrix

This mission adds five **fictional, detached, read-only** scenarios for the Mission 687 drift detector, Mission 688 severity classifier, and Mission 689 priority drift summary:

- `clean`: baseline without drift
- `safetyViolation`: unauthorized simulation flag
- `diagnosticRegression`: altered severity and priority fields
- `orderingChange`: reversed scenario and category order
- `mixedPriority`: combines safety, diagnostics, ordering and metadata drift

`createPriorityDriftSummaryScenarioInput(name)` creates a fresh synthetic input matrix. `createDiagnosticTriagePriorityDriftSummaryFixtureMatrix()` returns deterministic, detached scenario rows containing drift state, finding counts, severity counts, category names, and highest-priority fields.

Run `node hlm-diagnostic-triage-priority-drift-summary-fixture-matrix.test.js`. CI runs this and preceding diagnostic suites. Outputs never authorize simulation, mutate source data, or persist changes.

No Front Office, Phase 10 demo, browser saves, production gameplay, or live franchise records are modified.
