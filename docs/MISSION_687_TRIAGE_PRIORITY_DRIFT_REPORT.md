# Mission 687: Diagnostic triage priority drift report

`createDiagnosticTriagePriorityDriftReport(matrix = createDiagnosticTriagePriorityFixtureMatrix())` compares the detached, fictional Mission 685 fixture matrix with the independent immutable Mission 686 baseline.

It reports differences in matrix kind, version, scenario count/order, safety flags, missing or duplicated scenarios, per-scenario drift state, finding counts, highest severity, severity counts, category totals/order, priority fields/order and per-scenario authorization.

Each finding includes `scenario`, `field`, `expected`, `actual` and `code`. Array values are detached. The returned report always sets `simulationAuthorized`, `sourceStateMutated` and `persistencePerformed` to `false`; it is advisory, never permission to simulate or save.

Run `node hlm-diagnostic-triage-priority-drift-report.test.js`. CI runs this test and the earlier diagnostic test suites.

No Front Office, Phase 10 demo, browser saves, franchise records, or gameplay changes.
