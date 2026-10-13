# Mission 707: Priority summary of Mission 706 severity findings

This read-only advisory module organizes the Mission 706 classified drift findings into a deterministic priority report.

Export: `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityReport(severityReport?)`.

Findings are ordered by critical, high, medium, low severity; ties preserve input order. Findings are grouped by category. Category groups sort by their highest severity, then by lexical category name. The report provides exact per-level counts, highest severity, highest-severity-only priority findings, and critical/high urgent findings.

The output clones array-valued expected/actual data and each findings collection. Invalid reports and findings throw named error codes. Safety flags are always false, with no simulation authorization, source mutation or persistence.

Tests cover clean and mixed reports, exact counts and field ordering, category sorting, stable ties, mutation isolation, determinism and malformed inputs. Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-report.test.js`.

This mission does not alter Front Office, Phase 10 demo, browser saves, gameplay, or live franchise data.
