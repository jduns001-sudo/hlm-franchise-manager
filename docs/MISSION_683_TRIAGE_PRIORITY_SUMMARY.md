# Mission 683: Diagnostic triage priority summary

`createDiagnosticTriagePrioritySummary(severityReport = createDiagnosticTriageDriftSeverityReport())` consumes the read-only Mission 682 severity report.

Findings are prioritized critical, high, medium, low, with stable original ordering within a severity. Findings are grouped by category. Category groups sort by their highest severity, then category name alphabetically for ties. Each group contains counts by severity and detached findings. `priorityFindings` includes only findings at the report's highest severity.

The summary is advisory. It does not authorize simulation, mutate franchise data, or persist browser saves. Arrays in group and priority findings are independently detached from the source report.

Tests verify clean and mixed-severity reports, group and priority order, tie-breaking, category totals, deterministic output, input isolation, and invalid inputs.

Run `node hlm-diagnostic-triage-priority-summary.test.js`. CI also runs the prior diagnostic foundation tests.

No Front Office, Phase 10 demo, browser saves, live franchise records, or gameplay changes.
