# Phase 11 Production Integration Readiness (No Cutover)
Status: review-only, no production code or save mutation.

## Verified production architecture
Source: main/app.html at blob c3c743d3ce49fb4900d61c7b1ea38f739d05eaec.
- IndexedDB current database: `hlm_front_office_v8`, version 1, object store `state`, record key `db`.
- Historical migration source: `hlm_front_office_v5`, object store `state`, record `db`.
- `compactState()` emits schema 7, including settings, customPlayers, playerOverrides, draftPickOverrides, extraDraftPicks, decisions, transactions, lines, depth, contracts, prospects, draftBoard, history, waivers and notes.
- `save()` writes compactState() into IndexedDB; `initDB()` reads state, falls back to old migration, and hydrates current universe.
- UI Download Backup serializes `compactState()`; UI Restore Backup parses JSON and writes it directly to IndexedDB before initializing and rendering. Existing restore has no explicit replace confirmation or complete schema validation.
- Phase 11 experimental activation and rollback use separate localStorage keys for the source pointer and journal, not the production IndexedDB database. They are NOT production save backups.
- Current production entry loads the Front Office state-source browser adapter but does not include a production Phase 11 import cutover.

## Required future production integration gates
1. Read-only preflight: confirm IndexedDB availability, current and historical store/key layouts, schema compatibility, available storage capacity, active source, and any pending activation journal. Abort on ambiguity.
2. **Full-save backup**: snapshot the exact raw current IndexedDB `state/db` record before any mutation. Preserve null/missing state distinctly. Capture provenance (database, store, record key, schema, timestamp, version), verify serialized round trip and independently export a user-downloadable copy. Backup of the localStorage pointer is insufficient.
3. **Validation**: validate imported universe and all saved franchise fields; reject duplicates, bad references, oversized payloads and unsupported schema versions before a write. Define deterministic migration mapping and prove that roster, controlled team, draft picks, contracts and history survive.
4. **Explicit GM authorization**: display source, backup confirmation, affected records, and a clear irreversible-risk warning. No automatic activation on page load or selection. Require explicit confirmation after successful backup verification.
5. **Atomic cutover / journal**: stage candidate in a distinct versioned location. Record an idempotent transaction journal. Write only after preflight, backup and confirmation. Handle browser termination and storage quota errors; never discard the only valid backup.
6. **Rollback**: restore the exact raw IndexedDB `state/db` record (or delete if originally absent) and source pointer, then verify byte-equivalent or canonical structural equality. Do not call existing UI Restore Backup as a substitute for a validated recovery path.
7. **Acceptance**: automated real-browser tests for existing-save preservation, empty database, legacy migration, valid/invalid import, interrupted write, quota failure, reload recovery, repeated activation, rollback, controlled-team retention and hostile input; mobile smoke; Foundation Tests and published Pages tests.
8. **Rollout**: isolated opt-in feature flag, no default production switch, explicit GM approval. Deploy, verify live Pages, then enable in a separate reviewed PR.

## Current decision
**NO GO** for production cutover. This mission documents the actual IndexedDB boundary and enforces an automated source-readiness gate only. Do not change app.html, production database, or localStorage saves in this PR.
