# V2-04 integrated acceptance and experimental release readiness

## Release boundary

The functional entry is `hlm-v2-preview.html?a22Navigation=1`. Missing, zero or nonliteral flags leave the runtime iframe unloaded. The original isolated engine, atomic IndexedDB repository and transaction manager remain the sole gameplay/save authority. An iframe or a new path on the same origin does not isolate browser storage. The release candidate must be hosted on a separate HTTPS origin from production and every preview whose saves must remain untouched.

The permanent `hlm-v2-integrated.chromium.test.js` serves the actual application and uses disposable Chromium storage. It accepts `HLM_V2_RUNTIME_ROOT` to test an extracted candidate and `HLM_V2_EVIDENCE_DIR` for external results/screenshots. It requires only existing Playwright and system-Chromium preload dependencies. Original historical tests are preserved. No temporary adapted regression is needed by this suite.

## Connected acceptance

The suite creates source-backed Pittsburgh, visits Dashboard/More/roster/profile/lines/Game Center/Draft and Scouting at 360, 390, 412, 768 and 1280px; confirms an exact edited lineup and depth plan; reloads it; separately approves deployment and game-day skaters; cancels then explicitly confirms one game; and verifies its saved result, receipt count, standings and dashboard. A synthetic duplicate click cannot execute two games. Native two-tab lineup reviews produce one committed winner and one stale rejection. An injected acknowledgement loss occurs only after a durable commit; the original reload reconciles the authoritative record without retrying. A separate labeled test fixture tests reviewed draft rights without signing or roster insertion. No fixture is added to canonical application data or visual evidence.

## Physical Samsung checklist (pending)

Use a newly authorized, distinct HTTPS preview hostname and a NEW disposable franchise. Never import or modify the owner's existing Pittsburgh save for this check.

1. Record the full hostname, direct entry URL, release archive SHA-256 and Chrome version. Verify missing/zero opt-in does not start the experimental runtime. Unknown and legacy paths must return HTTP 404.
2. Open the literal opt-in URL; create a new disposable franchise through native confirmation. Record the franchise ID, epoch and revision from readonly evidence.
3. Visit all five navigation tabs and More. Open and close a player profile; check Back, focus, text, touch targets and horizontal scrolling. Background/resume Chrome once.
4. Begin a local lineup draft. Use Auto-Select, manually change and restore a position, edit supported depth order, then cancel. Reload: revision and committed assignments must be unchanged.
5. Repeat editing, review the exact named players and permanent IDs, accept native confirmation, and record the acknowledged revision. Do not proceed on a blocked or uncertain result.
6. Reload and compare authoritative `extensions.phase11LineupPlan` and the V2 saved-unit/depth view. Verify franchise ID/epoch and all six slots match. Record origin/revision/status if the displayed summary differs.
7. Review the committed starting-skater deployment, cancel once, then explicitly approve. Confirm that this alone does not approve or simulate a game.
8. Open the next controlled-team Game Center matchup. Check ID, opponent and date. Preview and inspect without writes. Review game-day skaters; decline once and verify no new revision. Re-review and explicitly approve.
9. Decline the game simulation dialog once. Then explicitly confirm exactly one disposable game. Check one new result/receipt, GP/points, dashboard feedback and subsequent matchup.
10. Reload, use browser Back, background/resume, close/reopen Chrome. Confirm the same franchise, final, reviewed plan and revision remain authoritative.
11. Open another disposable tab, review a change in both, commit once, and verify the other tab rejects its stale review. Reload explicitly; never retry an uncertain command. Do not erase browser storage as a recovery step.
12. Record screenshots and readonly evidence for any failure. Keep prior preview origins and production untouched. No existing save migration is authorized by this checklist.

The earlier physical Samsung report retained Pittsburgh but showed unavailable lineup summaries after an acknowledged save. Local tests have not reproduced data loss. Starting-unit plan, depth order, approved deployment, game-day plan and actual participation are different fields. The V2 Team view reads the authoritative record directly, while legacy availability summaries use a derived display snapshot. This is a diagnostic boundary, not an established device root cause. Physical acceptance remains unverified until this checklist is performed.

## Consolidated data and gameplay dependency register

| Dependency | Current implementation | Missing authority/capability | Relevant existing modules | Gameplay impact | Next controlled step |
|---|---|---|---|---|---|
| Conference/division membership | League order and explicit named saved-group filtering, with contradiction rejection | Canonical importer strips grouping; source numeric conference codes lack verified named dictionary; divisions blank | `hlm-phase11-new-franchise.js`, `hlm-v2-presentation.js`, `hlm-phase10-standings.js`, bundled source JSON | Named groups disabled in canonical saves; league standings still work | Obtain a versioned authoritative ID-keyed membership source, audit conflicts, then authorize readonly joining/import preservation |
| Complete NHL lineup management | Six starting slots, depth ordering, deterministic local Auto-Select, reviewed save and separate deployment | Full forward lines/defence pairs, rotations, ice-time roles and engine consumption beyond current participation contract | `hlm-phase11-lineup-plan.js`, existing isolated manager and experimental box-score modules | Starting-unit planning is not full line usage or observed participation | Define the next minimal engine-consumed assignment contract before any schema or scoring change |
| Prospect classes | Saved prospect identity/rights inspection and native reviewed draft selection | Canonical bundled sources contain no prospect class; no trusted import/generation policy | `hlm-draft-scouting-foundation.js`, `hlm-draft-future-pipeline.js`, `hlm-phase10-draft-selection.js`, importer | Fresh canonical franchises cannot perform meaningful prospect selection | Audit available source classes and permanent IDs; expose a class only after identity and draft eligibility are verified |
| Draft-pick ownership | Strict source-backed import/readiness and reviewed pick transfer | Source ownership/identity coverage excludes ambiguous and unsupported records; Pittsburgh canonical import has no verified owned picks | `hlm-draft-pick-source-authority.js`, `hlm-phase11-source-pick-transfer.js`, `hlm-phase11-new-franchise.js` | No picks must be inferred from names or assumed historical trades | Build one source-backed pick/class readiness audit before enabling an actual canonical Draft Center workflow |
| Contracts/salary cap | Recorded contracts/AAV and reviewed prospect signing | Complete active contracts, units, cap limits, dead money and league mechanisms are not established in isolated import | `hlm-contract-cap-planning-foundation.js`, `hlm-phase11-drafted-prospect-signing.js`, importer | No complete payroll/cap-space claim is possible | Verify contract IDs/units/ownership and a cap-rule source; retain unavailable states until then |
| Persisted scouting reports | Safe unavailable interface; actual ability is not disguised as an estimate | No isolated persisted report authority or transactional report command | `hlm-scouting-intelligence.js`, scouting foundation, isolated manager | No real saved scouting reports yet | Specify an authorized report authority and GM-reviewed persistence contract; no ad-hoc extension writes |
| Scout assignments | Foundation values only; assignment control disabled | Staff/coverage/resources and an authoritative command/persistence path | `hlm-scouting-assignments.js`, `hlm-prospect-evaluations.js` | No automatic scouting coverage or fabricated certainty | Verify saved staff and assignment rules after prospect-class authority is established |
| Missing player attributes | Saved identities/ratings/positions shown truthfully; unresolved ratings remain unresolved | Some positions, ratings, age and detailed attributes lack nonconflicting evidence | `hlm-phase11-new-franchise.js`, source JSON, `hlm-v2-team.js`, `docs/DATA_MODEL.md` | Eligibility may exclude unresolved players; profiles show Unknown/unavailable | Continue strict permanent-ID source audit; no name/jersey fallback or silent save migration |
| Physical Samsung persistence | Exact-plan reload, CAS and uncertain-outcome recovery pass locally | Device/origin/version-specific evidence and the original Samsung discrepancy are unresolved | Original atomic manager, V2 Team readonly evidence and integrated suite | Physical release acceptance remains conditional | Run the above new-franchise checklist on a separate authorized preview and capture evidence before correcting any existing save |

## Candidate and integration inventory

The runtime closure is derived from actual script/link/fetch/iframe references. The candidate includes only those runtime sources plus the previously approved root `404.html`; no index, app, legacy Gameplay Bridge, tests, prototypes, saves, Git metadata, credentials or source documentation. The ZIP/manifest and verification report live outside every worktree. The unchanged historical HTML remains a required runtime dependency; it is not a production entry point.

`V2_04_IMPLEMENTATION_INVENTORY.json` records exact V1/V2 implementation paths, roles and Git blobs. Its own blob is recorded externally to avoid self-referential hashes. Runtime, tests and fixture-only visual studies are classified separately. No listed path is staged by this mission.

### Intended future commit scope

The exact presentation allowlist is `futurePresentationCommitPaths` in the inventory. It includes V1/V2 source, original visual studies (explicitly fixture-only), V1/V2 tests and V1/V2 documentation, including this mission's permanent suite and inventory. It excludes all 12 pre-existing tracked modifications and the untracked A2-108/rating-repair tests from this presentation commit.

Those existing modified engine/HTML/importer/shell sources are nevertheless required runtime prerequisites. A presentation-only commit on the current HEAD would NOT capture the tested runtime. Before integration, obtain separate authorization to checkpoint the exact reviewed prerequisite patches and their tests, or verify an equivalent already committed prerequisite baseline. Do not silently omit them, bundle them into a presentation commit, or represent the dirty checkout as a fully committed release.

After authorization: reverify all hashes and worktrees; verify a local recovery kit; stage only a separately approved exact allowlist; inspect staged blobs/diff; create the authorized checkpoint(s) without amending history; rerun the permanent suite against a fresh packaged runtime; verify the sole intended branch moves and other worktrees do not. No branch switch, reset, clean, stash, worktree creation, push or merge is required by this plan.

### Recovery and hosting plan

Keep the existing sources and earlier artifacts untouched. A local recovery kit can pair the exact base-history Git bundle with a checksum-verified archive of the current dirty source files and an external manifest. Restoring anything requires separate approval and a disposable location first; never overlay the preserved worktrees or live saves automatically. The runtime candidate restores only the application bytes, not browser saves. User-save backup and recovery remain the existing reviewed mechanisms.

A dedicated free-tier Cloudflare Pages Direct Upload hostname is suitable in principle, with no repository connection, no catch-all rewrite and the root 404 safeguard. Account authorization, free-tier eligibility, project isolation, the previous immutable deployment/rollback target and actual hosted HTTP behavior must be verified in a separate deployment mission. No hosting access or free-tier eligibility is assumed here. Upload only the verified runtime candidate after authorization. Keep the exact ZIP and manifest for rollback; code rollback must not migrate or rewind a save.

Release gates: local integration PASS; artifact integrity PASS; owner visual review and physical Samsung acceptance PENDING; production readiness NOT ESTABLISHED. This mission does not deploy or claim a complete NHL rules/scouting simulation.

Recommended next accelerated gameplay mission: a source-backed draft-readiness audit and minimal canonical prospect/pick integration, after the physical disposable-save check. It should verify class/ownership coverage first and reuse existing reviewed rights-only selection, with no invented class, pick, contract, scouting report or automatic GM action.
