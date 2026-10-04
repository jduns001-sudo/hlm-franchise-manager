# Phase 2 Mission 14 — Preservation-Aware Migration Orchestration

The migration orchestrator now applies the deferred legacy preservation policy after Contract and Transaction identity migration.

Deferred legacy fields are no longer an unresolved migration gate because their original values are preserved losslessly under `extensions.legacy.preserved`. DraftPick identity remains unresolved and continues to block persistence planning when DraftPicks are present.

No browser storage or live Front Office integration is introduced.
