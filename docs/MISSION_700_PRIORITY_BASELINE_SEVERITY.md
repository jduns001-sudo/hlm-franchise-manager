# Mission 700: Priority baseline drift severity

Read-only, advisory severity classification for Mission 699's priority baseline drift findings. The classifier uses a fixed four-level order: `critical`, `high`, `medium`, `low`.

- **Critical / safety-invariant:** safety violation code or `simulationAuthorized`, `sourceStateMutated`, `persistencePerformed`.
- **High / diagnostic-regression:** highest severity, per-severity counts, priority fields, urgent fields.
- **Medium / ordering-or-count:** drift state, finding/category/scenario counts, category/scenario order and missing/duplicate scenarios.
- **Low / metadata-or-other:** version, kind and remaining metadata.

Exports `classifyPriorityBaselineDriftFinding(finding)` and `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySeverityReport(drift?)`. The report preserves original finding order and original indices, calculates counts and highest severity, detaches finding arrays, and always returns false safety flags. No sorting or prioritization is performed in this mission.

Validation errors: `INVALID_PRIORITY_BASELINE_DRIFT_FINDING` and `INVALID_PRIORITY_BASELINE_DRIFT_REPORT`. Test with `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-severity.test.js`.

This mission does not modify the Front Office, Phase 10 demo, browser saves, gameplay or live franchise data.
