# Mission 703: Priority summary regression fixture matrix

A read-only fictional regression matrix for the Mission 701 priority summary. Five scenarios are generated from fresh Mission 697 fictional data: `clean`, `safetyViolation`, `diagnosticRegression`, `orderingChange`, and `mixedPriority`. Each is passed through Mission 699 comparison, Mission 700 severity classification, and Mission 701 priority summary.

Exports:
- `PRIORITY_SUMMARY_SCENARIO_NAMES`, a frozen scenario-name list.
- `createPrioritySummaryScenarioInput(name)`, returning a fresh detached synthetic matrix.
- `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryFixtureMatrix()`, returning deterministic rows with drift status, severity counts, category order, priority fields, urgent fields, and false safety flags.

Mission 703 tests pin scenario behavior and exact output values, validate severity/count totals, deterministic repeated calls, mutation isolation, unknown-scenario errors, and advisory-only invariants. These are regression fixtures, **not** an independently pinned baseline; that can be added in a subsequent mission.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-fixture-matrix.test.js`. CI also runs the previous diagnostic test suites. No Front Office, Phase 10 demo, browser save, live franchise state or gameplay changes.
