# Mission 713: Read-only priority summary of Mission 712 drift

Mission 713 groups and prioritizes classified findings from the Mission 712 severity report. It is advisory only and cannot authorize simulation, mutate franchise state, or persist data.

Export: `createDiagnosticTriagePriorityDriftSummaryComparisonPrioritySummaryPriorityPriorityReport(severityReport?)`.

Findings are sorted critical, high, medium, low; ties retain original input order. Findings are grouped by category, with groups ordered by highest severity and then category name. Each group contains its own exact counts and detached findings. The report includes total finding count, drift flag, highest severity, counts, categoryCount, groups, priorityFindings (all findings at the highest present severity), urgentFindings (critical and high), baseline/matrix versions, and safety flags fixed to false.

Tests cover clean default output, exact nine-finding synthetic mixture (2 critical, 4 high, 2 medium, 1 low), group and finding order, high-only/medium-only/low-only cases, repeatability, independent output arrays, input non-mutation, invalid reports and invalid classified findings.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-report.test.js`.

No changes to Front Office, Phase 10 demo, browser saves, gameplay, or live franchise data.
