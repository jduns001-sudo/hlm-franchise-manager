# Mission 669: Read-only roster readiness validation summary

## Contract
`createRosterReadinessValidationSummary(pipeline)` accepts the Mission 668 pipeline output and returns a detached, read-only summary.

- `dataQuality.valid` and `dataQuality.reportedIssueCount` preserve the canonical bridge validation gate.
- `dataQuality.errors` copies the canonical bridge's diagnostics without reclassifying or suppressing them.
- `warnings.organization` copies organization-reference diagnostics as advisory warnings.
- `warnings.readiness` lists team readiness issue codes and unresolved player organization warnings separately from canonical errors.

A warning is not a game authorization and does not silently change validation. Some unresolved references may also produce canonical diagnostics; these remain visible in both their original data-quality context and the advisory readiness context. Warning counts represent warning records, not unique underlying problems.

## Safety and scope
No roster sufficiency or active-player determination, no automatic player movement, no UI wiring, no gameplay, no source JSON modifications, and no browser save access. `simulationAuthorized` remains `false` regardless of validation. The Front Office and Phase 10 demo are unchanged.

## Verification
`node hlm-roster-readiness-validation-summary.test.js` tests original error preservation, separate warnings, retired and unresolved cases, nonmutation, detached output, clean data with outstanding rules, and invalid input.
