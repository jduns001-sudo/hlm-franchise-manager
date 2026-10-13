# Mission 701: Read-only priority baseline summary

Mission 701 summarizes classified findings from Mission 700 without modifying game data. It accepts a Mission 700 severity report or uses the default fictional diagnostic report.

**Contract:** `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummary(severityReport?)` returns a deterministic advisory report with overall severity counts, highest severity, category groups, priority findings at the highest severity, and urgent findings (all critical and high findings). Findings are ordered by severity (critical, high, medium, low) and original input index; groups are ordered by highest severity then category name. The original index is preserved. Group and output arrays are independently detached from input and each other.

**Validation:** malformed reports raise `INVALID_PRIORITY_BASELINE_SEVERITY_REPORT`; malformed findings raise `INVALID_PRIORITY_BASELINE_CLASSIFIED_FINDING`. The report always sets `simulationAuthorized`, `sourceStateMutated` and `persistencePerformed` to false.

**Tests:** `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary.test.js` checks empty reports, mixed severity, category ordering, stable ties, urgent findings, input/output isolation, safety flags and invalid inputs. CI runs this and all preceding diagnostic test suites.

No Front Office, Phase 10 demo, browser saves, gameplay or live franchise data changes.
