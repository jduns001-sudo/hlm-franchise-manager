# Phase 2 Mission 12 — Migration Preparation / Orchestration Boundary

This mission composes the proven legacy preview, validation, Contract identity migration, and Transaction identity migration into one non-persisting preparation step.

The orchestrator deliberately refuses to describe the result as persistence-ready while unresolved DraftPick identity or deferred legacy fields remain. It never reads or writes browser storage and never changes app.html.

This is a preparation boundary, not a migration button.

## Output
The result contains the transformed GameState preview, pre-migration diagnostics, counts of Contract and Transaction identities changed, unresolved gates, a strict `readyForPersistencePlanning` flag, and `persistencePerformed:false`.

## Next
Resolve the authoritative homes of deferred legacy fields before any persistence integration. DraftPick identity remains a separate architectural gate.
