# Mission 714: Independent priority summary contract tests

Mission 714 independently verifies the Mission 713 priority report without using fixture generators, drift reports, or severity classifiers. Production logic is unchanged.

The literal nine-finding synthetic input is deliberately unsorted: two critical, three high, two medium, and two low findings, across eight categories. Contract assertions pin exact severity totals, highest severity, stable tie order, category alphabetical tie breaking, group membership, category counts, group counts, priority findings, urgent findings, versions, and original input indices.

Tests also cover clean, critical-only, high-only, medium-only, low-only, same-severity cross-category ordering, detached arrays in separate output views, input immutability, repeatability, malformed reports and malformed findings. The three safety flags remain false.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-contract.test.js`.

Only tests, documentation and CI are added. No Front Office, Phase 10 demo, browser save, gameplay or live franchise data changes.
