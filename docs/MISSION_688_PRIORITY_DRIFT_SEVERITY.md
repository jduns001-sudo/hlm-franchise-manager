# Mission 688: Diagnostic triage priority drift severity

`classifyPriorityDriftFinding(finding)` assigns an advisory severity and category to Mission 687 drift findings. `createDiagnosticTriagePriorityDriftSeverityReport(drift)` produces deterministic counts and preserves source finding order and original indices.

| Severity | Meaning | Category |
| --- | --- | --- |
| Critical | Safety flags or explicit safety invariant drift | `safety-invariant` |
| High | Highest severity, per-level severity counts or priority field drift | `diagnostic-regression` |
| Medium | Scenario order/presence, category order, drift/count changes | `ordering-or-count` |
| Low | Version and other metadata | `metadata-or-other` |

The report returns `highestSeverity`, counts for critical/high/medium/low, detached findings and false `simulationAuthorized`, `sourceStateMutated` and `persistencePerformed` flags. No permission to simulate or save is implied.

Run `node hlm-diagnostic-triage-priority-drift-severity.test.js`. CI runs this and preceding diagnostic suites. Tests cover every severity, deterministic order, isolation, malformed inputs and safety.

No Front Office, Phase 10 demo, browser saves, franchise data or gameplay changes.
