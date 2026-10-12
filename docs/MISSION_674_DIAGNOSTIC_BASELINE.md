# Mission 674: Versioned diagnostic expected-results baseline

The standalone `hlm-franchise-diagnostic-baseline-v1.js` defines **version 1** of the independent expected-results contract for the four fictional Mission 672 fixtures. The Mission 673 regression matrix is evaluated against these expectations by `hlm-franchise-diagnostic-baseline-v1.test.js`.

## Baseline v1
- `clean`: valid canonical data, two teams, two candidates, zero unresolved players, and undefined roster requirements.
- `invalidIdentities`: invalid canonical data, one team and one candidate, with duplicate/invalid Universe identity and missing Universe roster identity errors.
- `unresolvedOrganizations`: invalid canonical references, one candidate and four unresolved players, preserving unknown positive IDs and the `-1`, `0`, and `100` sentinels.
- `mixedRoster`: two teams, two candidates, two unresolved players, and retired-player and unresolved-organization warnings.

The baseline pins specific counts and required diagnostic codes, **not** every advisory warning or issue count. Additional diagnostics may be valid and require separate review. This prevents noisy snapshot churn while still detecting meaningful regressions. The expectations are authored independently from the live matrix and are not regenerated during testing.

The test also deliberately mutates matrix results to prove the comparator detects changes to counts, missing error codes, simulation authorization, and fixture order.

Run `node hlm-franchise-diagnostic-baseline-v1.test.js`. Baseline changes require explicit review and a new version if contract semantics change.

No production simulation rules, Front Office, Phase 10 demo, browser saves, or live franchise records are modified.
