# Mission 681: Read-only diagnostic triage drift reporter

`createDiagnosticTriageDriftReport(matrix = createDiagnosticTriageFixtureMatrix())` compares the six fictional Mission 679 triage scenarios with the independent frozen Mission 680 expected baseline.

The report returns ordered structured findings with `scenario`, `field`, `expected`, `actual`, and `code`. It detects matrix identity/version/count changes, scenario order or missing/duplicated scenarios, changed drift flags/counts, highest severity, individual severity counts, category ordering, priority-field ordering, and simulation authorization/source-mutation/persistence invariants. Missing expected rows are reported without inventing values.

The reporter is diagnostic only. It never grants permission to simulate, never writes browser storage, and never modifies source inputs. Findings arrays are detached from inputs and frozen baseline arrays.

Run `node hlm-diagnostic-triage-drift-report.test.js`. The dedicated GitHub Actions workflow runs this and the earlier diagnostic regression suites.

No changes to the Front Office, Phase 10 demo, browser saves, live franchise records, or gameplay runtime.
