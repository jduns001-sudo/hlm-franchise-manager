# Mission 746: Controlled experimental research report validation

Status: planning only, pending Mission 745 Foundation CI and merge.

## Implementation requirements

- Start from main after Mission 745 is merged, not the current branch.
- Validate research-report shape, evidence blockers, finite nonnegative expected goals and probability tails in [0,1].
- Return explicit validation findings without authorizing simulation or selecting scores, winners, or standings.
- Do not mutate franchise state, browser storage, Phase 10 demo, Front Office, or Phase 11 import paths.
- Add deterministic complete/incomplete evidence regression tests, dedicated Node CI, and Foundation CI.

Do not merge executable implementation until both workflows are green.
