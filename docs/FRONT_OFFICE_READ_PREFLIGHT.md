# Phase 2 Mission 29: Front Office Read Preflight

## Purpose

Compose the read-only Front Office runtime adapter with the proven legacy migration preparation pipeline.

This is the last standalone inspection layer before a future live runtime hook. The host supplies its existing state-read function. No write function is accepted.

## Output

The preflight reports:

- whether the current Front Office state can be read;
- basic runtime counts and controlled-team identity;
- whether legacy migration preparation considers the snapshot ready for persistence planning;
- migration blockers and warnings.

## Safety boundary

This module cannot write to IndexedDB, localStorage, GameState saves, or the existing Front Office state. It does not import or call any write function.

It does not modify `app.html`, `initDB()`, `openStateDB()`, `readState()`, `writeState()`, service-worker caching, or the live UI.

A future live integration should first expose this preflight as a diagnostic-only action. Only after physical regression testing should any write-capable migration control be considered.
