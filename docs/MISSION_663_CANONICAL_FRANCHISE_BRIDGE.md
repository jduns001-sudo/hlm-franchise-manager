# Mission 663: Canonical Player to Simulation Bridge

## Purpose
Compose the existing Phase 1 canonical player registry/authority resolver with Mission 662's read-only simulation identity bridge. No live runtime or save integration.

## Public API
`createCanonicalFranchiseBridgeSnapshot(universe, roster, options)` in `hlm-canonical-franchise-bridge.js`.

- `universe` supplies canonical teams and player identities.
- `roster` supplies historical snapshots, **not** authoritative team assignment.
- `options.playerFixes` and `options.playerOverrides` use the existing resolver precedence.
- The canonical player pipeline resolves one player per Universe ID and records provenance.
- A temporary in-memory GameState envelope is created and passed to the Mission 662 identity bridge.
- Output includes `teams`, `players`, `provenanceByPlayerId`, `canonicalSummary`, `diagnostics`, `validation`, and read-only-operation flags.
- Canonical duplicate/invalid Universe IDs and orphan roster IDs are surfaced as diagnostics; unresolved team references remain intact and are reported.
- No source data is modified, no saves are written, and no simulation games are played.

## Important boundaries
This module does not turn roster snapshots into current player identities. It does not resolve external organization IDs, assign eligibility, migrate saves, update the live Front Office, or alter Phase 10 scoring. A future mission must explicitly decide how non-team organizations and sentinel IDs should be classified before real roster-driven gameplay.

## Tests
`node hlm-canonical-franchise-bridge.test.js` tests resolver precedence, duplicate historical snapshots, duplicate canonical IDs, unknown team references, source isolation, and provenance.

Protected runtime/data files and save keys are unchanged.
