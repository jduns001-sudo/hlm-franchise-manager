# Phase 11 Block L.1C: Trusted Host Authority Boundary

Status: **NO GO for real-franchise enrollment or production activation**. Experimental review service remains unmounted/default-off.

## Repository evidence
- `PHASE11_PRODUCTION_INTEGRATION_READINESS.md` identifies production `hlm_front_office_v8`, object store `state`, record `db`, and explicitly prohibits production cutover.
- `hlm-game-state.js` defines `meta.saveId` and `meta.controlledTeamId`; these are state metadata, **not independently authenticated ownership credentials**.
- `hlm-phase11-block-l-trusted-enrollment.py` requires a trusted source resolver to confirm `owner_gm`, `franchise`, `browserSaveId`, `controlledTeamId`, and `sourceDigest`.
- `hlm-phase11-block-l-sqlite-binding-resolver.py` can require an existing matching trusted enrollment. The experimental HTTP endpoint requires authenticated session, CSRF, franchise authorization, and signed bindings.
- Repository search did not identify an independently authenticated server-owned GM/franchise registry or trusted host service suitable for live enrollment. Browser IndexedDB/localStorage cannot fill this gap.

## Minimal future host contract
The host, not the browser, must (1) authenticate a stable GM principal and session identifier, (2) read a server-owned franchise record from a separately controlled store, (3) validate the owner, franchise, save ID, controlled team and source digest, and (4) provide a resolver scoped to that authenticated principal. The host must reject absent/ambiguous/stale records and never infer ownership from client-supplied save metadata. Do not expose an enrollment route until these dependencies exist and are tested.

## Security acceptance required before integration
- Missing host source, wrong owner, save/team/digest mismatch, and forged browser claims fail closed without enrollment or simulation writes.
- Valid enrollment remains immutable/idempotent and survives file-backed SQLite close/reopen.
- Session rotation, expiration, stale revision, replay and wrong GM reject signed review/settlement without simulation writes.
- Only explicit human GM approval may commit a reviewed simulation.
- Production IndexedDB `state/db` and browser save namespaces are never touched.

## Current action
No new registry, host, listener, production route, UI change or save migration is authorized. Keep PR #1685 draft/unmerged; no deployment. The new deterministic negative enrollment test is a boundary regression, not proof that a real trusted host exists.
