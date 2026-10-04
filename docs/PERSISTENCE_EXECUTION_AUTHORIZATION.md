# Phase 2 Mission 27: Persistence Execution Authorization

## Purpose

Close the safety gap between preparing an atomic persistence plan and actually executing it.

## Rules

- A newly-created atomic persistence plan is deliberately non-executable.
- The persistence executor rejects a plan unless it has been explicitly authorized.
- Authorization records explicit confirmation and whether replacement of an existing target save slot is allowed.
- Existing target slots are protected by default.
- Replacement requires separate `replaceExisting: true` authorization.
- The legacy Front Office source remains preserved.
- Verification and rollback requirements remain mandatory.

## Migration command behavior

The migration command authorizes a plan only after `confirmed: true`. A confirmed migration does not imply permission to replace an existing new-engine save. Replacement must be explicitly requested.

## Runtime scope

This mission does not modify `app.html`, IndexedDB, `initDB()`, `openStateDB()`, the legacy Front Office save path, or the live GitHub Pages UI. It is a standalone Phase 2 safety boundary.
