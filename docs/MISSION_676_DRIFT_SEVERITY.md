# Mission 676: Diagnostic drift severity classification

`hlm-diagnostic-drift-severity.js` provides two read-only functions:

- `classifyDriftFinding(change)` classifies an individual Mission 675 change.
- `createDiagnosticDriftSeverityReport(drift?)` classifies all findings in a Mission 675 drift report, or a fresh fictional-fixture report if omitted.

Severity categories are **critical**, **high**, **medium**, and **low**. Critical findings concern simulation authorization, source mutation, or persistence invariants. High findings cover missing canonical diagnostics, validity and unresolved-organization changes. Medium findings cover candidate/team counts and fixture membership/order. Low findings cover other metadata drift.

The returned report includes per-severity counts, the highest severity, and a detached array of findings with original code, fixture, field, expected/actual values, severity and category. Severity is **advisory only** and never authorizes simulation or changes data.

Tests cover all categories, clean baseline, multiple simultaneous changes, count consistency, invalid inputs, detached outputs, and safety invariants.

Run `node hlm-diagnostic-drift-severity.test.js`. The CI workflow also runs existing diagnostic foundation suites.

No Front Office, Phase 10 demo, browser saves, live franchise records, or gameplay rules are modified.
