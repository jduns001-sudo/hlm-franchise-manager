# Phase 2 Mission 3 — Save-File Envelope & Integrity Boundary

## Purpose
Wrap serialized GameState in a portable save-file structure with metadata and a corruption/tamper detection boundary.

## Save envelope
The version-1 envelope contains:
- format marker `HFM_SAVE`,
- save-format version,
- metadata for save ID, label, timestamps, in-game date, and controlled Team,
- integrity metadata,
- serialized GameState payload.

The save-format version is separate from the GameState schema version. Either can evolve independently.

## Integrity
Mission 3 uses deterministic FNV-1a 32-bit hashing as a lightweight corruption detector.

This is **not cryptographic security**. Its job is to catch accidental payload changes/corruption before a damaged state is accepted. A future storage layer may add stronger mechanisms without changing GameState.

Integrity is checked before GameState deserialization.

## Boundary
This module remains storage-agnostic. It does not write files, use IndexedDB/localStorage, create slots, autosave, migrate legacy state, or connect to the Front Office.

## Next controlled step
Phase 2 Mission 4 should define an in-memory save repository/slot contract so save creation, listing, loading, replacement, and deletion semantics can be proven before browser persistence.

## Exit gate
Mission 3 is complete when a valid GameState can be wrapped and restored, metadata remains outside the payload, altered payloads are rejected, unsupported save-format versions are rejected, and the live Front Office remains untouched.
