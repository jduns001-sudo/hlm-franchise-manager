# Mission 685: Diagnostic triage priority fixture matrix

`createDiagnosticTriagePriorityFixtureMatrix()` evaluates five **fictional**, detached cases through the existing Mission 681 drift reporter, Mission 682 severity classifier, and Mission 683 priority summary.

| Scenario | Deliberate input change | Expected highest severity |
| --- | --- | --- |
| clean | None | None |
| safetyViolation | Matrix simulation authorization changed | Critical |
| diagnosticRegression | Highest severity and high-severity count changed | High |
| orderingChange | Category order reversed | Medium |
| mixedPriority | Safety, diagnostic, ordering and version changes | Critical |

Each scenario starts from a newly created Mission 679 triage fixture matrix, never from a shared or live franchise object. Returned rows include severity counts, categories, priority fields, and false simulation authorization. Tests independently pin all five expected rows, assert deterministic output and detached scenario inputs, reject unknown names, and check that the original fixture generator remains unchanged.

Run `node hlm-diagnostic-triage-priority-fixture-matrix.test.js`. CI runs this plus preceding diagnostic suites.

This is a developer diagnostic fixture only. No Front Office, Phase 10 demo, browser saves, live franchise records, or gameplay code changes.
