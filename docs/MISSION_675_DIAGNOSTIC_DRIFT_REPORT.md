# Mission 675: Diagnostic baseline drift reporter

`createFranchiseDiagnosticDriftReport(matrix?)` compares a Mission 673 regression matrix with the independently authored Mission 674 Baseline v1. With no argument, it creates a fresh matrix from the four fictional fixtures. It does not load actual franchise data.

The report returns `kind`, `version`, `baselineVersion`, `matrixVersion`, `hasDrift`, `changeCount`, and a detached `changes` array. Each change records `fixture` (null for matrix-level changes), `field`, `expected`, `actual`, and a diagnostic `code`.

Checks include matrix identity/version, fixture order and missing/duplicate fixtures, baseline-pinned validity/counts, missing required error and readiness codes, pinned unresolved organization warning counts, and unauthorized simulation flags. Optional new advisory diagnostics do not trigger drift because Baseline v1 deliberately pins only required codes and selected counts.

Tests verify a clean baseline, deliberate alterations, optional warning tolerance, malformed input handling, no input mutation, and fresh independent output.

Run `node hlm-franchise-diagnostic-drift-report.test.js`. This is a read-only development diagnostic and does not modify Front Office, Phase 10 demo, browser saves, game rules, or simulation authorization.
