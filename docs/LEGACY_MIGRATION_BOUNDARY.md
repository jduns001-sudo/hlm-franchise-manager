# Phase 2 Mission 8 — Legacy Front Office Migration Boundary

## Purpose
Define how the existing Front Office local state can be inspected and previewed as new GameState without writing, deleting, or replacing any user data.

## Confirmed legacy shape
The existing roster importer uses localStorage key `hlm_tracker_v3` and builds fields for players, teams, seasons, awards, transactions, draftPicks, prospects, draftClasses, gmSettings, contracts, snapshot, and franchiseName.

Mission 8 treats that shape as legacy input only.

## First-pass mappings
Direct preview mappings are intentionally limited:
- players → universe.players
- teams → universe.teams
- prospects → universe.prospects
- contracts → assets.contracts
- draftPicks → assets.draftPicks
- transactions → activity.transactions
- seasons → history.seasons

Awards, draftClasses, gmSettings, snapshot, and franchiseName are explicitly deferred until their new authoritative homes are defined. Nothing is silently discarded during a real migration because this mission does not perform one.

## Non-destructive rule
The module accepts a supplied legacy object. It never reaches into localStorage, IndexedDB, app.html, or the new browser-save namespace.

`createLegacyMigrationPreview()` clones mapped collections through the GameState constructor. The source legacy object remains unchanged.

## Important limitation
A preview is not yet an approved migration. Entity-level reconciliation, permanent IDs, controlled-team mapping, backup preconditions, and legacy/new save coexistence still require dedicated steps.

## Next controlled step
Phase 2 Mission 9 should add migration validation/reconciliation diagnostics so a preview can be classified as safe, warning-bearing, or blocked before any persistence write is considered.

## Exit gate
Mission 8 is complete when legacy structure can be inspected, mappings and deferred fields are explicit, a standalone GameState preview can be built without mutation, and no storage side effects occur.
