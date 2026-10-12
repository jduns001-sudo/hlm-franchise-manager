# Mission 679: Diagnostic triage fixture matrix

`createDiagnosticTriageFixtureMatrix()` exercises the complete read-only diagnostic chain with controlled fictional changes:

1. Mission 673 regression matrix from the four fictional fixtures
2. Mission 675 comparison against Baseline v1
3. Mission 676 severity classification
4. Mission 677 priority and category grouping

Six named scenarios are generated independently: `clean`, `simulationAuthorization`, `missingCanonicalDiagnostic`, `rosterCountChange`, `metadataVersionChange`, and `mixedPriority`.

The output summarizes each scenario's drift count, highest severity, severity counts, category names/counts, and highest-priority fields. `createTriageScenarioMatrix(name)` returns a fresh detached fictional matrix for independent inspection and testing. No live franchise records or browser saves are read.

Tests pin expected severity counts, verify each row against direct pipeline composition, test scenario isolation and deterministic output, and assert no simulation authorization, persistence, or source mutation.

Run `node hlm-diagnostic-triage-fixture-matrix.test.js`. The dedicated CI workflow also runs existing franchise diagnostic tests.

This is developer-only diagnostic scaffolding. The Front Office, Phase 10 demo, browser saves, game rules and production runtime are unchanged.
