# Mission 668: Read-only roster readiness pipeline

## API
`createSimulationRosterReadinessPipeline(universe, roster, options = {})` composes three existing pure functions, in order:

1. `createCanonicalFranchiseBridgeSnapshot` (Missions 663–665): permanent player/team identities, resolver precedence, organization classification and canonical validation.
2. `assessSimulationRosterEligibility` (Mission 666): nonretired known-team candidates, retired exclusions and unresolved references.
3. `createSimulationRosterReadinessReport` (Mission 667): team counts, unresolved groups and diagnostic issues.

Returns `{ kind, version, bridge, eligibility, readiness, validation, simulationAuthorized, sourceStateMutated, persistencePerformed }`. `validation` is copied from the canonical bridge, not weakened or silently repaired. `simulationAuthorized` is always `false`, including for a valid bridge. The pipeline makes no active-roster, game, or lineup eligibility decisions.

## Boundaries
This is a standalone CommonJS module. No Front Office or Phase 10 demo wiring, source JSON edits, browser storage or save key changes, roster movement, score generation or game simulation. Input data is not mutated. Historical roster duplicates remain historical.

## Tests
`node hlm-simulation-roster-readiness-pipeline.test.js` compares each composed stage against direct standalone calls, verifies resolver precedence, unresolved reference preservation, output isolation, nonmutation and nonauthorization of simulation.
