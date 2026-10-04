# Phase 1 Mission 4 — Player Field Authority Resolver

## Purpose
Turn the approved Player authority map into a deterministic, inspectable resolver without changing the live Front Office.

Mission 3 established one canonical Player registry record per permanent Universe Player ID and retained roster rows as source snapshots. Mission 4 resolves selected current Player fields from those sources while recording where each resolved value came from.

## Authority order implemented
The resolver follows the current application rules documented in `docs/DATA_MODEL.md`:

1. **Universe** supplies permanent identity, names, base current team assignment, retirement state, and base fields.
2. **Roster snapshots** may supply positive Overall, Potential, and Position. For compatibility with today's overlay behavior, the latest source row wins when several roster snapshots supply the same field.
3. **PLAYER_FIXES** overrides Position and Potential.
4. **playerOverrides** is highest authority for fields it contains.
5. Player `id` can never be overridden.

Roster `teamId` is deliberately not used to replace Universe current team assignment. Mission 1 established that roster team assignment is historical/stale for many players.

## Provenance
`resolvePlayerRecord()` returns both:
- `player`: a new resolved object
- `provenance`: source metadata for resolved fields

The resolver does not mutate the canonical registry record or any source snapshot.

## Important limitation
Using the latest roster source row for duplicate snapshots is a **compatibility rule**, not a claim that file order is correct hockey truth. Mission 3 continues to expose conflicts. A future importer may replace this with season-aware normalization after authoritative season metadata is available.

## Runtime boundary
`hlm-player-resolver.js` is standalone CommonJS code and is not loaded by `app.html`.

No source JSON, IndexedDB/localStorage state, contracts, DraftPicks, Free Agency behavior, or UI is changed.

## Out of scope
GameState, save migration, calendar, simulation, development, CPU AI, Team/Organization migration, Contract/Transaction migration, permanent DraftPick migration, source-data repair, and UI redesign.

## Exit gate
Mission 4 is complete when the resolver:
1. preserves permanent Player ID,
2. reproduces the documented authority order for its supported fields,
3. never promotes roster `teamId` over Universe current assignment,
4. exposes provenance,
5. is pure/read-only,
6. leaves protected runtime/data files unchanged.
