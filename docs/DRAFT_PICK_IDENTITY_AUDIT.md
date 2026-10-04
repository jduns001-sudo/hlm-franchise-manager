# Phase 1 Mission 8 — DraftPick Identity Audit Boundary

## Purpose
Make DraftPick identity risk executable and explicit before Phase 2.

The current prototype can derive DraftPick IDs from league/year/original team/round plus occurrence order. Mission 1 found repeated natural identities in the Universe data, so occurrence-based IDs must remain prototype identifiers rather than permanent IDs.

## Policy
A DraftPick is a persistent asset. Its permanent identity must not change when ownership changes.

Original owner and current owner remain separate concepts.

This mission deliberately does **not** assign permanent DraftPick IDs. It audits:
- records with no existing ID,
- repeated natural keys,
- duplicate existing IDs,
- source/reference fields needed by a future migration.

## Natural key
The audit groups records by:
`league | year | originalTeamId | round`

This is useful for detecting collisions but is **not** declared a permanent identifier. Multiple source records can share that tuple.

## Migration boundary
Permanent DraftPick identity requires a Phase 2 migration/source-authority decision because:
- Universe and roster DraftPick sources differ,
- repeated natural keys exist,
- current prototype occurrence ordering is not a durable identity guarantee,
- unresolved owner references such as Team ID 27 remain data-quality issues.

No source is silently discarded or promoted here.

## Runtime boundary
`hlm-draft-pick-identity.js` is standalone CommonJS code, not loaded by `app.html`, and performs no writes.

## Out of scope
Choosing the authoritative DraftPick source, generating permanent IDs, migrating browser saves, resolving Team ID 27, changing Draft Picks UI, trade logic, GameState, save serialization, simulation, AI, or source JSON.

## Exit gate
Mission 8 is complete when collisions and missing identity are detectable without mutation, original/current ownership remain separate in references, prototype IDs are explicitly non-permanent, and protected runtime/data files remain unchanged.
