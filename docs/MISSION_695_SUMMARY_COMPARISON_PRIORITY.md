# Mission 695: Priority summary of comparison severity

This read-only report groups Mission 694 severity findings by category and orders findings **critical, high, medium, low**, with stable original-order ties. Groups are sorted by highest severity then category name. The report includes per-group counts, highest severity, a `priorityFindings` array for the highest current severity, and an `urgentFindings` array containing all critical and high findings.

Export: `createDiagnosticTriagePriorityDriftSummaryComparisonPriorityReport(severityReport?)`. Default input is the detached fictional diagnostic comparison pipeline. Outputs are deterministic, independently detached from inputs and from each other, and never authorize simulation, mutate state or persist data.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority.test.js`. CI runs this and preceding diagnostic suites. No changes to Front Office, Phase 10 demo, browser saves, gameplay or live franchise records.
