# Mission 699: Priority fixture baseline comparison

Compares Mission 697's fictional priority fixture matrix with Mission 698's independently frozen baseline. The report is **read-only and advisory**. It emits detached findings `{ scenario, field, expected, actual, code }` in deterministic order: matrix metadata, scenario order, then each expected scenario and its fields.

The comparison detects matrix metadata/safety changes, scenario reordering, missing or duplicate scenarios, drift/count/severity differences, category order, highest-priority fields, urgent critical/high fields, and per-row simulation authorization. It never authorizes simulation, mutates inputs, persists browser state or changes real franchise records.

Export: `createDiagnosticTriagePriorityDriftSummaryComparisonPriorityDriftReport(matrix?)`. The default input is the fictional Mission 697 matrix. Error code for invalid matrix shape: `INVALID_SUMMARY_COMPARISON_PRIORITY_FIXTURE_MATRIX`.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-drift-report.test.js`. CI also runs preceding diagnostic suites. No Front Office, Phase 10 demo, browser saves or gameplay changes.
