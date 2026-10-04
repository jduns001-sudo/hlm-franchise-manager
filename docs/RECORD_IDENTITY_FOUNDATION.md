# Phase 1 Mission 7 — Mutable Record Identity Foundation

## Purpose
Establish the permanent-ID boundary for Contracts and Transactions before those records become part of central GameState.

Current prototype browser records do not reliably contain permanent Contract or Transaction IDs. This mission does **not** rewrite those records. It provides rules for new IDs and a read-only audit that tells a future migration exactly where legacy identity work is required.

## New-record namespaces
- Contract: `CON-<stable-token>`
- Transaction: `TXN-<stable-token>`

The stable token must be supplied by the future creation command/save layer. This module deliberately does not derive permanent identity from mutable hockey data such as player name, salary, team, array position, or timestamp alone.

## Legacy policy
A legacy record with no permanent ID remains a legacy record.

`auditMutableRecordIdentity()` reports:
- missing IDs,
- invalid IDs,
- duplicate IDs,
- whether migration is required.

It never invents IDs, changes array order, deletes records, or writes browser state.

## Why no automatic migration yet
The current prototype can contain multiple offers/contracts for one player and Transaction rows lack stable Player/Team references. Assigning IDs before the Phase 2 save/migration boundary is defined could make accidental identities permanent.

Phase 2 will own the actual save-schema migration and creation-token strategy.

## Runtime boundary
`hlm-record-identity.js` is standalone CommonJS code and is not loaded by `app.html`.

## Out of scope
Migrating existing browser saves, changing Contract/Transaction structures in the live app, DraftPick identity, GameState, save serialization, commands/events, simulation, AI, or UI.

## Exit gate
Mission 7 is complete when permanent namespaces are explicit, invalid/missing/duplicate legacy IDs are detectable read-only, mutable hockey fields are not used as permanent identity, and protected runtime/data files remain unchanged.
