# Mission 662: Read-only franchise simulation data bridge

## Scope
`hlm-franchise-simulation-data-bridge.js` exports `createFranchiseSimulationSnapshot(state)`.
It accepts a central GameState envelope and returns a detached identity snapshot for future simulation integration.

This is **not** the production roster importer, the player field resolver, or a player-driven game engine. Canonical player values must be resolved by the existing Phase 1 registry/resolver pipeline *before* being placed into GameState.

## Contract
- Input: `state.universe.teams` and `state.universe.players` from a valid GameState envelope.
- Output: `{kind, version, teams, players, diagnostics, validation, sourceStateMutated, persistencePerformed}`.
- Team snapshot: `{id, name, playerIds}`.
- Player snapshot: `{id, teamId, teamResolved, retired, position, overall}`.
- IDs must be positive safe **integer numbers**. Duplicate canonical IDs are reported and skipped after the first occurrence.
- Only exact numeric team IDs resolve. Unknown positive organization IDs and distinct sentinel values `-1`, `0`, `100` are preserved and reported; no free-agent inference is made.
- `playerIds` represent identity assignments, **not** eligibility or lineup selections. Retired players are retained for identity/history purposes.
- Invalid envelope shape throws `INVALID_FRANCHISE_BRIDGE_STATE` with validation details. Identity/reference problems return diagnostics instead of silently changing data.
- This snapshot contains detached plain objects/arrays and performs no writes.

## Protected boundaries
No changes to `app.html`, `phase10-demo.html`, `hlm-phase10-browser.bundle.js`, `hlm-universe.json`, legacy roster JSON, or existing save keys. No UI redesign, storage migration, schedule changes, or score calculations.

## Testing
Run `node hlm-franchise-simulation-data-bridge.test.js`. The dedicated Mission 662 GitHub Actions workflow also runs this test and the existing GameState envelope test.

## Follow-up, not part of this mission
Integrate the canonical player resolver with a validated GameState import; distinguish historical roster snapshots from current team assignments; design organization-reference handling before introducing player-dependent game results.
