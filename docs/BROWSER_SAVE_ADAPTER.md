# Phase 2 Mission 5 — Browser Persistence Adapter

## Purpose
Persist the new save-envelope format across browser sessions without touching the existing Front Office storage.

## Isolation rule
The new adapter defaults to the dedicated key:

`hfm_game_state_saves_v1`

The prototype Front Office historically uses other storage/database locations, including `hlm_tracker_v3`. Mission 5 does not read, modify, migrate, clear, or delete those locations.

## Contract
The adapter mirrors the proven save-slot behavior:
- save,
- list,
- load,
- explicit replacement,
- remove,
- existence check.

Every slot stores a complete save envelope, so integrity and GameState validation still occur in the lower save layers.

## Dependency boundary
The adapter accepts a Web Storage-compatible object rather than reaching for `window.localStorage` itself. That keeps the persistence contract testable and prevents hidden browser coupling.

## Failure behavior
Malformed save-index JSON fails explicitly. Duplicate saves require explicit replacement. Missing slots fail explicitly. Removing the final new-engine slot removes only the dedicated new-engine storage key.

## Runtime boundary
This module is not loaded by `app.html`. The live Front Office remains disconnected from the new save engine.

## Next controlled step
Phase 2 Mission 6 should define backup/export and import validation for the new save format, still isolated from legacy migration.

## Exit gate
Mission 5 is complete when new-engine saves can persist through a Web Storage-compatible adapter, legacy storage is demonstrably untouched, save-envelope validation remains enforced, and the live application remains disconnected.
