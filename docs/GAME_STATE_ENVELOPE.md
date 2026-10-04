# Phase 2 Mission 1 — Central GameState Envelope

## Purpose
Create the first standalone container for the unified simulation state described by the project architecture.

The GameState envelope is the future source consumed by simulation, AI, saves, and UI. Mission 1 defines its outer boundary only. It does not yet replace the prototype browser database.

## Schema version
The initial standalone envelope uses `schemaVersion: 1`.

Schema version belongs to the state/save architecture so future migrations can identify the shape they are loading.

## Top-level sections
- `meta`: save identity, timestamps, controlled team, current date
- `universe`: Players, Teams, Leagues, Prospects, Staff
- `assets`: Contracts and DraftPicks
- `activity`: Transactions, Games, Injuries
- `history`: Seasons, Statistics, historical records
- `finances`: financial state
- `extensions`: reserved compatibility space for future bounded additions

These are ownership boundaries, not finished entity schemas.

## Construction
`createGameStateEnvelope()` builds a fresh state object and clones supplied data so the new envelope does not alias or mutate its import sources.

Missing collections begin empty.

## Validation
`validateGameStateEnvelope()` currently validates:
- supported schema version,
- required top-level sections,
- expected collection fields are arrays.

This is structural validation only. Entity-level integrity will be added incrementally rather than creating one giant validator.

## Critical boundary
This module is **not loaded by app.html**.

It does not:
- read or write IndexedDB/localStorage,
- migrate existing saves,
- alter the current Front Office,
- advance time,
- mutate gameplay,
- simulate games,
- run CPU organizations,
- make AI decisions.

## Why the envelope comes first
Every later Phase 2 feature needs one agreed location for state. Save serialization, commands, events, migrations, and eventually the UI can then target the same model instead of creating parallel truths.

## Next controlled step
After this mission, the next logical mission is versioned GameState serialization/round-trip validation using synthetic state only.

Legacy browser migration must wait until the standalone save path is proven.

## Exit gate
Mission 1 is complete when:
1. one versioned central envelope exists,
2. its major ownership sections are explicit,
3. construction does not mutate or alias source inputs,
4. malformed structure is detectable,
5. the live Front Office remains disconnected and unchanged.
