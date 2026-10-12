# Mission 689: Diagnostic triage priority drift summary

`createDiagnosticTriagePriorityDriftSummary(severityReport = createDiagnosticTriagePriorityDriftSeverityReport())` groups Mission 688 classified findings by category and highlights all findings tied at the highest urgency.

Severity order is critical, high, medium, low. Findings retain their original input order within each severity. Categories sort by highest severity first, then alphabetically for ties. The summary includes per-category counts, overall counts, highest severity, `groups`, and `priorityFindings`.

Arrays in the output are detached from the input and from one another. The report is read-only and always sets `simulationAuthorized`, `sourceStateMutated`, and `persistencePerformed` to `false`.

Run `node hlm-diagnostic-triage-priority-drift-summary.test.js`. Tests cover clean and mixed findings, deterministic sorting, tied category ordering, source isolation, invalid input, and safety invariants. CI also runs earlier diagnostic suites.

No Front Office, Phase 10 demo, browser saves, live franchise records, or gameplay changes.
