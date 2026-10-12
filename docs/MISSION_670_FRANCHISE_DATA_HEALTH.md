# Mission 670: Read-only franchise data health report

## Purpose
`createFranchiseDataHealthReport(universe, roster, options = {})` composes the existing Mission 668 pipeline and Mission 669 validation summary into one detached report for future diagnostics.

The report contains:
- `dataQuality`: unchanged canonical validation result, reported issue count, and diagnostic errors.
- `warnings`: separate advisory organization and roster readiness warnings, with original warning count.
- `roster.summary`: team/candidate/unresolved counts from Mission 667.
- `roster.teams`: descriptive team counts, issue codes, unknown sufficiency, and null game readiness.
- `roster.unresolvedByStatus`: unresolved player counts by organization-reference classification.

No threshold, lineup eligibility, active-roster decision, or new validation rule is inferred. `simulationAuthorized` is always false, including for clean canonical data. Diagnostic warnings are not promoted into errors and original validation errors are not suppressed. Team roster rows omit player identity lists by design; those remain in the underlying pipeline.

## Boundaries
Standalone CommonJS module only. No Front Office or Phase 10 demo wiring, browser storage, save migrations, source data edits, team reassignment or gameplay changes. Inputs are not mutated.

## Verification
`node hlm-franchise-data-health-report.test.js` checks parity with existing pipeline/summary, retired and unresolved cases, clean canonical data with outstanding rules, detached output, and nonauthorization.
