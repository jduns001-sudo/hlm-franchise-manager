# Phase 2 Mission 15 — DraftPick Source Authority Boundary

The prototype contains more than one DraftPick collection. They must not be merged or promoted automatically.

For migration planning, the imported/legacy Front Office DraftPick collection is the operational ownership overlay when present. Universe DraftPicks remain reference data. If the legacy collection is absent, Universe DraftPicks are still reference-only and are not automatically promoted into mutable GameState ownership assets.

This boundary prevents stale or ambiguous Universe pick ownership from overwriting the Front Office's operational ownership data.

Permanent DraftPick identity remains unresolved. This mission establishes source authority only. It does not assign IDs, repair picks, merge collections, or persist data.
