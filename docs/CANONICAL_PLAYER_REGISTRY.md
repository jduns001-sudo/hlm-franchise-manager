# Phase 1 Mission 3 — Canonical Player Registry Prototype

## Purpose
Create the first executable, read-only normalization layer beneath the future GameState.

This mission implements only the Player identity boundary already specified in `docs/DATA_MODEL.md`:
- Universe Player ID is canonical.
- One canonical Player exists per permanent Player ID.
- Roster rows are source snapshots, not additional Players.
- Duplicate/conflicting roster rows are preserved and reported.
- Unknown or conflicting values are not silently repaired.

## Runtime boundary
`hlm-canonical-data.js` is a standalone CommonJS module. It is **not loaded by `app.html`** and does not alter the current Front Office.

It performs no file writes, localStorage/IndexedDB access, migrations, player moves, contract changes, DraftPick changes, or UI operations.

## Registry shape
`buildCanonicalPlayerRegistry(universe, roster)` returns:

- `playersById: Map<PlayerID, RegistryRecord>`
- `diagnostics`

Each registry record contains:
- `playerId`
- `canonical`: the unchanged Universe Player object
- `sources.universe`: Universe source index and object
- `sources.rosterSnapshots`: every roster row for the same Player ID, with source index
- `conflicts`: conflicting roster values for audited fields

No roster snapshot is promoted to a second canonical Player.

## Conflict policy
Mission 3 deliberately does **not** choose a winner among conflicting duplicate roster rows.

The prototype audits:
- Overall
- Potential
- Team ID
- Position fields
- Player type
- AAV
- Years left

Conflicts are returned as diagnostics. File order is retained only as source provenance and is never treated as authority.

## Identity failures
The registry reports:
- invalid Universe Player IDs
- duplicate Universe Player IDs
- invalid roster Player IDs
- roster Player IDs absent from Universe
- duplicate roster Player IDs
- duplicate roster Players containing conflicting audited fields

It does not auto-create missing Players or renumber anything.

## Authority boundary
This mission intentionally stops before field reconciliation.

Current application authority rules such as roster Overall overlay, `PLAYER_FIXES`, `playerOverrides`, and browser state remain documented in `DATA_MODEL.md` and remain untouched.

A later mission may define a deterministic field-resolution layer after each field's authority rule is approved. That layer must consume this registry rather than treating roster rows as Players.

## Out of scope
- GameState
- save migration
- calendar/season engine
- simulation
- player development
- CPU AI
- Organization migration
- resolving the 416 outside-table organization IDs
- resolving Team ID 27
- permanent DraftPick migration
- Contract/Transaction migration
- changing Free Agency
- modifying source JSON
- wiring normalization into the Front Office
- UI redesign

## Exit gate
Mission 3 is complete when:
1. The registry is read-only and standalone.
2. One Universe Player ID produces at most one canonical registry record.
3. All roster rows remain inspectable as snapshots.
4. Duplicate/conflicting rows are surfaced rather than silently selected.
5. Protected runtime/data files remain unchanged.
6. The existing Front Office still loads after merge.
