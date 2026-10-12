# Mission 673: Franchise diagnostic regression matrix

`createFranchiseDiagnosticRegressionMatrix()` runs all four fictional Mission 672 fixtures through the existing Mission 670 franchise data health report. It returns a detached, deterministic summary row for each fixture.

Each row contains its fixture name, canonical validation flag and issue count, error codes, organization and readiness warning codes, warning count, team/candidate/unresolved player counts, unresolved organization-status counts, and `simulationAuthorized: false`.

The matrix does **not** change canonical validation, define roster thresholds, select active players, or authorize gameplay. It does not access browser storage, real franchise saves, the Front Office, or the Phase 10 demo.

## Regression contract
The Mission 673 tests compare every row against its direct franchise data health report, then assert the expected characteristics of the clean, invalid-identity, unresolved-organization, and mixed-roster fixtures. They also verify fresh independent outputs, deterministic repeat runs, and persistent nonauthorization.

Run `node hlm-franchise-diagnostic-regression-matrix.test.js`. The new GitHub Actions workflow also runs the existing diagnostic foundation suites.
