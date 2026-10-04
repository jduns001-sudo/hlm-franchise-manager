# Phase 1 Mission 5 — Canonical Player Snapshot Pipeline

## Purpose
Compose the Phase 1 Player foundation into one read-only pipeline that can eventually feed the central GameState.

Mission 3 created the canonical Player registry. Mission 4 created deterministic field resolution. Mission 5 combines those layers without wiring them into the current Front Office.

## Pipeline
`buildCanonicalPlayerSnapshot(universe, roster, options)` performs:

1. Build one registry record per permanent Universe Player ID.
2. Preserve every roster row as source provenance.
3. Resolve approved current fields using the Mission 4 authority rules.
4. Apply optional `playerFixes` and `playerOverrides` by permanent Player ID.
5. Return a resolved Player array, a Player-ID index, provenance, and diagnostics.

The output is a **snapshot**, not GameState. It contains no commands, events, simulation state, save migration, calendar, or mutation API.

## Read-only guarantees
The pipeline does not mutate:
- Universe input
- roster input
- registry records
- PLAYER_FIXES supplied by a caller
- playerOverrides supplied by a caller
- browser storage

It performs no file writes.

## Snapshot validation
`validateCanonicalPlayerSnapshot()` checks the minimum identity invariant required before GameState work:
- every Player has a positive safe integer ID,
- no Player ID appears twice,
- the Player-ID index size agrees with the resolved Player set.

This validator reports errors only. It does not repair records.

## Why this comes before GameState
The future GameState must consume a stable Player representation rather than recreating the current mixture of raw Universe rows, roster overlays, compatibility fixes, and browser overrides.

Mission 5 creates that boundary while leaving the prototype application untouched.

## Out of scope
GameState, save format/migration, calendar, simulation, player development, CPU AI, Team/Organization normalization, Contract/Transaction migration, DraftPick migration, Free Agency changes, source JSON changes, and UI redesign.

## Exit gate
Mission 5 is complete when:
1. registry + resolver compose deterministically,
2. permanent Player identity remains unique,
3. provenance and diagnostics survive composition,
4. source inputs remain unchanged,
5. the module remains disconnected from `app.html`,
6. protected runtime/data files remain unchanged.
