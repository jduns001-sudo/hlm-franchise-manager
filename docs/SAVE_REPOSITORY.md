# Phase 2 Mission 4 — Save Repository / Slot Contract

## Purpose
Define save-slot behavior independently from browser storage.

The in-memory repository proves the contract that a later IndexedDB adapter must implement without risking existing prototype saves.

## Supported operations
- create a named slot,
- list slots and metadata,
- load and validate a slot,
- replace a slot only when explicitly requested,
- delete a slot,
- check existence and count slots.

Duplicate slot creation fails by default. Replacement requires `replace: true`. Missing loads/deletes fail explicitly.

Every stored value is a complete versioned save envelope, so integrity and GameState validation remain in the lower layers rather than being duplicated by storage.

## Why memory first
Storage technology should not define game semantics. Proving slot behavior in memory gives us a clean contract before IndexedDB, export/import, autosave, backup, or recovery are introduced.

## Boundary
This module does not use IndexedDB, localStorage, files, browser APIs, or the current Front Office database. It does not migrate legacy state.

## Next controlled step
Phase 2 Mission 5 should define a storage-adapter interface and a browser persistence implementation under a **new isolated namespace**, without reading or modifying the existing Front Office save key/database.

## Exit gate
Mission 4 is complete when create/list/load/replace/delete semantics are explicit, save-envelope validation remains enforced, accidental overwrite is prevented, and the live Front Office remains untouched.
