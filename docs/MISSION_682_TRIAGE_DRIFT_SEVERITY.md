# Mission 682: Diagnostic triage drift severity

`createDiagnosticTriageDriftSeverityReport(drift = createDiagnosticTriageDriftReport())` classifies each structured Mission 681 drift finding without changing source data.

Severity mapping:

- **Critical / safety-invariant:** simulation authorization, source mutation, or persistence flags.
- **High / diagnostic-regression:** highest-severity changes, individual severity-count changes, and priority-field changes.
- **Medium / ordering-or-count:** category/scenario ordering, missing/duplicate scenarios, and drift/category/scenario counts.
- **Low / metadata-or-other:** version and other metadata changes.

The result includes detached findings with their original index, severity/category, per-level counts, and highest severity. Classification is descriptive and never authorizes simulation or persistence.

Tests verify each severity/category mapping, a mixed end-to-end drift report, stable finding order, detached nested arrays, invalid-input rejection and false safety flags. Run `node hlm-diagnostic-triage-drift-severity.test.js`.

The Front Office, Phase 10 demo, browser saves, live franchise records and gameplay runtime remain unchanged.
