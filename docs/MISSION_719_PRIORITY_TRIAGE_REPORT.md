# Mission 719: Read-only priority triage report

Mission 719 consumes Mission 718 classified drift findings and produces deterministic advisory triage. It does not modify franchise state, authorize simulation, persist data, or affect the Front Office or Phase 10 demo.

Export: `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityPriorityReport(severityReport?)`.

The report validates the Mission 718 severity report kind and finding count, then validates each finding. Invalid reports throw `INVALID_PRIORITY_SUMMARY_FINAL_SEVERITY_REPORT`; invalid findings throw `INVALID_PRIORITY_SUMMARY_FINAL_CLASSIFIED_FINDING`.

Findings sort by severity **critical, high, medium, low**, preserving input order within severity using `originalIndex`. Category groups are sorted by their highest severity, then category name lexically. Each group includes severity counts, count, highest severity and detached findings. `priorityFindings` contains the report's highest severity; `urgentFindings` contains critical and high findings. Expected and actual arrays are copied separately across groups and priority/urgent views.

The report includes `kind`, `version:1`, baseline and matrix versions, findingCount, hasDrift, highestSeverity, counts, categoryCount, groups, priorityFindings, urgentFindings and three false safety flags.

Exact tests cover clean behavior, a nine-finding synthetic mix (critical 2, high 4, medium 2, low 1), stable ordering, category counts, urgency, detachment, repeatability, high/medium/low-only cases, and invalid inputs.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-priority-report.test.js`.

No Front Office, Phase 10 demo, browser save, franchise data or gameplay changes.
