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

## Frozen host interface contract (review-only, not a host implementation)

**Trust domains.** Browser payload, IndexedDB `meta.saveId`/`meta.controlledTeamId`, localStorage and browser-supplied claims are untrusted. The trusted host alone owns authentication, authorization, and the independent authoritative source. SQLite enrollment and reviewed-plan tables are evidence to compare against that source, not substitutes for it.

**Required host inputs and outputs.**
1. `session_resolver(bearer)` authenticates a server-recognized credential and returns a stable nonempty `gm` principal and `session_id`. No browser-supplied GM/session may be promoted to authority.
2. `authorize(session, franchise)` checks a separately controlled franchise ownership record, requiring the authenticated principal to own the requested franchise. Missing, ambiguous, or conflicting records deny.
3. `trusted_source_resolver(gm, franchise)` reads fresh independently controlled host state and returns exactly the required identity evidence: `owner_gm`, `franchise`, `browserSaveId`, `controlledTeamId`, and `sourceDigest`. The digest must be calculated/validated from authoritative host source data, not copied from a client assertion or solely from enrollment SQLite.
4. `resolve_authoritative_review(connection, gm, franchise, require_enrollment=True, require_trusted_host_source=True, trusted_source_resolver=...)` compares current host evidence to enrolled save/team/digest and the authoritative review. It must return no binding if source is absent, malformed, stale, or raises.
5. `IsolatedReviewBinding.issue/verify` requires a valid authenticated GM/session and re-resolves current authority when issuing and verifying a signed review. Session rotation, expired binding, changed revision/plan/ownership or source digest must deny. The host must provide CSRF verification and keep signing secrets server-only.

**Integration rule.** The existing experimental WSGI mount accepts injected callbacks; their callability alone does not prove their trustworthiness. Do not mount for real franchises until independently authenticated host dependencies are implemented, reviewed and tested. `require_trusted_host_source=True` is mandatory for any future real-host resolver wiring. The optional compatibility mode is exclusively for isolated synthetic fixtures.

## Frozen negative acceptance matrix

| Condition | Required outcome | Existing regression evidence |
| --- | --- | --- |
| No trusted resolver or missing host record | No binding, no write | `test_real_host_mode_requires_fresh_independent_authority`, `test_separately_controlled_host_authority_binding_lifecycle` |
| Wrong GM or franchise owner | Deny, no write | `test_wrong_owner_cannot_issue`, `test_separately_controlled_host_authority_binding_lifecycle` |
| Save/team mismatch or stale source digest | Deny, no write | `test_enrolled_digest_must_match_fresh_host_source`, `test_separately_controlled_host_authority_binding_lifecycle` |
| Forged browser ownership or enrollment | Deny, no enrollment | `test_browser_metadata_cannot_become_trusted_source`, `test_missing_or_conflicting_host_source_fails_without_enrollment` |
| Missing/rotated session or expired signature | Deny, no write | `test_missing_session_identity_fails_closed`, `test_expiration_and_session_rotation_fail_closed` |
| Review revision/plan changes or replay | Deny stale action | `test_stale_review_rejected_after_authoritative_revision`, Block L authenticated HTTP regression suite |
| Valid synthetic authority and stable session | Read-only binding issue/verify | `test_separately_controlled_host_authority_binding_lifecycle` |
| Real host, production cutover and live GM approval | **Not established / NO GO** | Requires separate host implementation and production acceptance |

This matrix identifies existing test coverage; it does not assert that a real trusted host exists or that production browser storage has been exercised by the synthetic tests.
