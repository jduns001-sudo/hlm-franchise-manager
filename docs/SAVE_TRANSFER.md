# Phase 2 Mission 6 — Backup / Export & Import Validation

## Purpose
Define a portable backup/export format for the new GameState save architecture and validate imports before they can reach persistence.

## Export wrapper
The export wrapper has its own marker and version:
- `format: HFM_EXPORT`
- `formatVersion: 1`
- optional export timestamp
- one complete versioned save envelope

The export version, save-envelope version, and GameState schema version are separate compatibility boundaries.

## Import safety
Import inspection parses the wrapper, verifies the export format/version, then delegates to the existing save-envelope loader. That means payload integrity and GameState structural validation must pass before an import is considered valid.

`inspectGameStateImport()` is non-throwing and intended for preview/validation flows. `importGameState()` throws explicit coded errors for command-style use.

## Boundary
Mission 6 does not automatically write imported data anywhere. It does not use browser storage, overwrite a slot, migrate legacy state, trigger downloads/uploads, or connect to the Front Office.

## Why this precedes migration
A portable validated backup format gives the new architecture a recovery path before legacy data is transformed. Migration work can later require a successful export/backup checkpoint before any write is allowed.

## Next controlled step
Phase 2 Mission 7 should add automated execution of the accumulated foundation and Phase 2 tests before runtime integration grows. After that gate is green, legacy migration can be designed from proven components.

## Exit gate
Mission 6 is complete when valid state exports/imports losslessly, malformed wrappers fail safely, unsupported export versions are rejected, tampered save payloads are rejected, and import validation performs no persistence side effects.
