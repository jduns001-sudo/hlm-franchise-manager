# Phase 1 Mission 6 — Team Reference Registry

## Purpose
Convert the Mission 2 Team/Organization identity findings into a safe executable boundary without inventing organization identities that the source data does not establish.

## Rules
The Universe Team table is the only source promoted to a known Team record in this mission.

References to IDs outside that table are preserved and classified:
- positive unknown ID → `unresolved-positive`
- zero or negative ID → `sentinel`
- non-integer/unusable value → `invalid`
- Team-table ID → `known-team`

Unknown positive IDs are **not** converted to Free Agents, historical Teams, minor clubs, junior clubs, European clubs, or new Team records.

Sentinels are **not** assigned invented meanings. Mission 2 found evidence for no-team-like usage but did not establish one universal semantic definition for every source/context.

## Diagnostics
The registry records:
- invalid Team-table IDs,
- duplicate Team-table IDs,
- unresolved positive references and their source counts,
- sentinel references and their source counts.

Player `teamId` and available DraftPick owner/original-owner fields are inspected read-only.

## Why this matters
Future GameState cannot safely assume every positive team-like ID is a known NHL Team. The current data contains many positive assignments outside the 277-record Team table, and DraftPick owner ID 27 remains unresolved.

This module gives later import/GameState work an explicit third state between “known Team” and “Free Agent”: **unresolved reference**.

## Runtime boundary
`hlm-team-reference-registry.js` is standalone CommonJS code. It is not loaded by `app.html` and performs no writes.

## Out of scope
Creating an Organization table, resolving the 416 outside-table IDs, defining sentinel semantics, resolving DraftPick owner 27, franchise lineage, league membership, historical relocation, source JSON repair, GameState, save migration, simulation, AI, and UI changes.

## Exit gate
Mission 6 is complete when:
1. Team-table IDs are indexed without mutation,
2. unknown positive references remain unresolved,
3. sentinel values remain distinct from known Teams,
4. no unknown reference is auto-promoted or repaired,
5. diagnostics preserve reference counts,
6. protected runtime/data files remain unchanged.
