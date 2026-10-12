# Mission 664: Organization reference classification

This standalone, read-only helper uses the existing `docs/DATA_MODEL.md` Team/Organization ID strategy and does not change the earlier team reference registry.

## API
`createOrganizationReferenceClassifier(teams)` returns a classifier with `classify(rawTeamId)`, `classifyPlayers(players)`, known team IDs, source diagnostics and read-only-operation flags.

| Status | Interpretation |
|---|---|
| `known-team` | Exact numeric positive ID exists in the canonical team table |
| `external-organization-unresolved` | Positive ID is absent from that table; do not invent its category |
| `sentinel-no-team` | `-1`, inferred no-team style marker, **not** proof of free agency |
| `sentinel-unassigned` | `0`, inferred unassigned marker |
| `sentinel-legacy-unknown` | `100`, ambiguous legacy/historical marker |
| `other-negative-sentinel` | Other negative integer, unknown meaning |
| `invalid-reference` | Null, string, non-integer or non-safe-integer value |

Team table duplicates and invalid IDs produce diagnostics. `eligibleFreeAgent` is `null` on unresolved/sentinel classifications; the helper does not determine roster eligibility.

## Boundaries
No browser storage, Front Office UI, Phase 10 demo, save key, gameplay, team reassignment, or external organization record is modified. The classifier is not yet wired into Mission 663 or the live simulation. Future integration must decide which diagnostic categories are informational versus blocking.
