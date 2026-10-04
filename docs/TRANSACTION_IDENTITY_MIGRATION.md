# Phase 2 Mission 11 — Transaction Permanent-ID Migration Foundation

## Purpose
Provide one bounded, deterministic migration path for legacy Transaction records that do not yet have valid permanent Transaction IDs.

## Behavior
`migrateTransactionIdentities()` clones the supplied records. Existing valid `TXN-...` IDs are preserved. Missing or invalid IDs receive deterministic IDs derived from available legacy transaction identity fields plus the frozen source index.

The migration is idempotent. Once assigned, permanent IDs are preserved on every later run.

## Source-index rule
The source index is migration provenance for a specific frozen legacy Transaction collection and distinguishes otherwise identical historical records. It is not a general runtime identity strategy. After migration, the assigned permanent ID becomes authoritative and must be persisted.

## Safety
- no browser storage access,
- no app integration,
- no persistence,
- source records are not mutated,
- valid IDs are preserved,
- the migrated collection is re-audited before return.

## Remaining identity debt
Contract migration now has its own bounded foundation. Transaction migration is covered here. DraftPicks remain intentionally deferred until their source authority and persistent identity can be resolved without relying on occurrence order.

## Next controlled step
After this mission, Phase 2 should define a migration preparation/orchestration boundary that can apply the proven Contract and Transaction transformations to a preview while still refusing persistence until backup and unresolved DraftPick/deferred-field policy gates are satisfied.
