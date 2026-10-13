# Phase 11 Production Integration Safety Review: NO CUTOVER

Status: **review-only**. No production Front Office integration or save mutation is authorized.

## Evidence and boundary
- PR #842: isolated IndexedDB snapshot and GM-authorized restore.
- PR #843: JSON portable export and mocked failure acceptance.
- PR #844: Chromium IndexedDB tests for capture, authorized restore, absence, invalid envelope and transaction abort.
- Production IndexedDB: `hlm_front_office_v8`, `state/db`; historical migration `hlm_front_office_v5`; compact franchise save schema 7.
- Production `app.html` remains untouched.

## Mandatory gates before a production integration PR
1. **Durable backup evidence**: read current raw record; distinguish absent from present; verify JSON round-trip, size, integrity digest and user-controlled file persistence by reopening the exported file. A callback returning `true` is not proof of durable storage. Structured-clone types and non-JSON payloads require an explicit lossless compatibility policy.
2. **Interruption recovery**: versioned staging plus persistent journal before any cutover. Test process/page termination between journal, write, and verification; reload must recover the last verified state without duplicate activation. Real IndexedDB aborted transactions are covered by PR #844, but browser-termination recovery is **not**.
3. **Schema compatibility**: reject unknown future schemas and malformed references before mutation; test v5 migration, v8 current state and schema 7 preservation. Define deterministic mappings and explicit rejection for unsupported fields.
4. **Controlled-team retention**: preserve controlled-team ID and valid team selection, contracts, draft picks, custom players, roster, lines, prospects, history, and settings; compare before/after canonical snapshots.
5. **Explicit GM approval**: show exact affected records, verified export file and rollback instructions; require separate affirmative GM authorization after validation and backup. No automatic switch or silent restore.
6. **Opt-in rollout**: feature flag defaults OFF; separate reviewed production PR and mobile acceptance; published Pages smoke, Foundation Tests and recovery drills required before opt-in can be enabled.

## Blocking findings in existing isolated helpers
- `hlm-phase11-indexeddb-backup.js` uses `JSON.stringify/parse` to clone. This is not lossless for all IndexedDB structured-clone types; restrict and prove a JSON-only franchise schema or replace the clone strategy before production use.
- `hlm-phase11-idb-portable-export.js` trusts a download callback's boolean. No re-import from a user-held file, digest or file-system persistence proof is implemented.
- Current `app.html` UI restore directly writes parsed JSON; it is **not** a validated production cutover path.
- Isolated browser tests do not prove reload recovery, quota handling, legacy migration or full published Front Office integration.

## Release decision
**NO GO** until each gate has implementation evidence, automated acceptance and explicit human GM sign-off. This document and its test gate do not modify application behavior or saves.
