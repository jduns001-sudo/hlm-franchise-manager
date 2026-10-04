# Phase 2 Mission 10 — Contract Permanent-ID Migration Foundation

## Purpose
Provide one narrow, deterministic migration path for legacy Contract records that do not yet have valid permanent Contract IDs.

## Behavior
`migrateContractIdentities()` returns cloned Contract records. Existing valid `CON-...` IDs are preserved. Missing or invalid IDs receive deterministic IDs derived from stable legacy record inputs plus the source index.

The migration is idempotent: running it again on its own output changes zero IDs.

## Why source index is allowed here
Unlike DraftPicks, this migration operates on a specific frozen legacy Contract collection. The source index is part of the migration provenance used to distinguish otherwise identical legacy records. The assigned ID is then persisted permanently and must never be regenerated from reordered data.

This does **not** make occurrence-order identity acceptable for DraftPicks. DraftPick source authority remains unresolved and is explicitly outside this mission.

## Safety
- no localStorage or IndexedDB access,
- no app.html integration,
- no automatic persistence,
- source Contracts are not mutated,
- existing valid permanent IDs are preserved,
- the completed collection is re-audited before being returned.

## Remaining work
Transactions still require their own bounded identity migration. DraftPicks remain deferred. A later migration orchestrator must require backup/export before any legacy state is replaced.

## Exit gate
Mission 10 is complete when legacy Contracts can receive deterministic, unique, valid permanent IDs in a standalone, idempotent, non-mutating transformation covered by the automated test gate.
