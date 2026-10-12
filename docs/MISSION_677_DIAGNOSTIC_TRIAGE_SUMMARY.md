# Mission 677: Diagnostic triage summary

`createDiagnosticTriageSummary(severityReport?)` consumes the read-only Mission 676 severity report. When omitted, the reporter evaluates the four fictional fixtures through the existing diagnostic pipeline. It never loads real franchise saves.

The detached output groups findings by category, provides a count and per-severity breakdown for each category, and lists `priorityFindings` at the **highest currently observed severity**. A clean baseline returns zero findings, no groups, and a null highest severity. Findings retain fixture, field, code, expected/actual values, severity, category and original index. Within each category findings follow severity priority, with stable original order for ties. Groups are ordered by their highest severity and then category.

This is an **advisory diagnostic**, not a gameplay authorization, roster rule, or permission to mutate source data. The summary always sets `simulationAuthorized: false`, `sourceStateMutated: false`, and `persistencePerformed: false`.

Tests cover clean and mixed severity results, count consistency, priority selection, grouping, deterministic ordering, invalid inputs and detached outputs.

Run `node hlm-diagnostic-triage-summary.test.js`. The workflow also runs the existing franchise diagnostic foundation suites.

No Front Office, Phase 10 demo, browser saves, source data, or gameplay code is changed.
