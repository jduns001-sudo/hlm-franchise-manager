# Mission 694: Summary comparison severity classification

Mission 694 adds a **read-only advisory** severity layer for Mission 693 priority drift summary comparison findings.

- **Critical / safety-invariant:** safety invariant codes or `simulationAuthorized`, `sourceStateMutated`, `persistencePerformed` fields
- **High / diagnostic-regression:** `highestSeverity`, `severityCounts.*`, `priorityFields`
- **Medium / ordering-or-count:** scenario order, missing/duplicate scenarios, category order, and count fields
- **Low / metadata-or-other:** version, kind, and other metadata

Exports `classifySummaryComparisonFinding(finding)` and `createDiagnosticTriagePriorityDriftSummaryComparisonSeverityReport(comparison?)`. The report retains original finding order and indices, detached expected/actual arrays, total counts, highest severity, baseline/matrix versions and false safety flags. Invalid reports/findings are rejected.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-severity.test.js`. CI runs the new suite and previous diagnostic suites. No Front Office, Phase 10 demo, browser saves, gameplay, or live franchise data changes.
