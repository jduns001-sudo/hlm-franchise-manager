# Mission 690: Independent priority drift summary contract

Mission 690 adds a **tests-only** contract for `createDiagnosticTriagePriorityDriftSummary` (Mission 689).

The seven fictional classified findings and expected results are manually authored and pinned independently of the implementation. Assertions verify exact category grouping, per-category and total critical/high/medium/low counts, severity and alphabetical tie-breaking, stable finding ordering and original indices, priority selection, mixed-severity categories, empty reports, malformed inputs, repeatability and detached outputs.

Safety invariants `simulationAuthorized`, `sourceStateMutated`, and `persistencePerformed` must always remain false.

Run `node hlm-diagnostic-triage-priority-drift-contract.test.js`. CI runs this test and prior diagnostic suites. No production modules, Front Office, Phase 10 demo, browser saves, live franchise records or gameplay are changed.
