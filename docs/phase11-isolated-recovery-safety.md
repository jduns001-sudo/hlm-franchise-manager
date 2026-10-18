# Phase 11 experimental isolated recovery: safety boundaries

- **Disabled by default.** The experimental HTML page is not the production Front Office activation path.
- **Production saves:** Experimental session data uses `sessionStorage` key `hlm-phase11-isolated-recovery-transaction-v1`. Do not reuse production storage keys or import experimental data into a live save without a separately reviewed migration.
- **Human GM authority:** Preview and explicit approval are required for restore and game-day advancement. No automatic roster decisions, transactions or production writes.
- **Tab isolation, not atomic cross-tab coordination:** `sessionStorage` is generally scoped to a top-level browsing context. Independent tabs have separate sessions; duplicated tabs can initially inherit a copy. Revision checks only protect the current session and are **not** a multi-tab compare-and-swap guarantee. Do not claim cross-tab atomicity or shared state.
- **Interrupted writes:** A failed `setItem` leaves prior state unchanged in the mocked storage regression; malformed records are rejected. This is not a guarantee against power loss, browser eviction, quota failure, or storage-engine corruption.
- **Privacy:** Checkpoint exports explicitly allowlist team, player, game and metadata fields. Avoid storing notes, emails, medical details or hidden properties. Export is not encrypted; anyone possessing the file may read the allowlisted data.
- **Simulation scope:** A deterministic prototype score generator and simple standings are not a full NHL rules engine, overtime standings system, player statistics simulator or playable release certification.
- **Release gates:** All workflows and individual jobs on the final PR head must pass. Merge only with expected SHA and appropriate permissions; verify every changed file's full Git blob hash against main afterward.
