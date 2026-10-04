# Phase 2 Mission 16 — Operational DraftPick Permanent-ID Migration

Source authority is now established: only the frozen imported/legacy operational DraftPick collection is eligible for this migration. Universe DraftPicks remain reference-only.

Missing operational pick IDs receive deterministic `PICK-` identifiers. The legacy source index is used only as frozen migration provenance to distinguish repeated natural keys. Once assigned, the ID must be persisted and becomes the stable identity; runtime systems must never regenerate it from occurrence order.

Existing valid unique `PICK-` IDs are preserved. Input records are cloned and not mutated. The transform is deterministic and idempotent for the same frozen collection.

This module does not migrate Universe reference picks, write browser storage, or alter the live Front Office.
