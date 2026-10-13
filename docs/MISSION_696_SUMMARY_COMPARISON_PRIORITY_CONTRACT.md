# Mission 696: Independent priority report contract tests

Mission 696 independently tests the Mission 695 priority report with literal synthetic findings, without importing upstream fixtures, comparison reports, or severity classifiers.

The contract pins the empty state and a nine-finding mixed-severity example, with exact severity totals, five category groups, stable ordering within severity, critical-only `priorityFindings`, critical-plus-high `urgentFindings`, original indices, input isolation, deterministic reruns, and disabled safety flags. High-only and medium-only cases ensure prioritization works without critical findings. Invalid reports and malformed classified findings must fail with the documented error codes.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-contract.test.js`. CI also runs all prior diagnostic suites. No production module, Front Office, Phase 10 demo, browser save, gameplay, or live franchise record is changed.
