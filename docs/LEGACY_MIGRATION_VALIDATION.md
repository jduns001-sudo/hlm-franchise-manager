# Phase 2 Mission 9 — Legacy Migration Validation & Reconciliation Diagnostics

## Purpose
Classify a proposed legacy Front Office migration before any persistence write is permitted.

## Classifications
- **safe**: no blockers or warnings were found.
- **warning**: no structural blocker exists, but unresolved migration work remains.
- **blocked**: a structural condition makes persistence unsafe.

`safeToPersist` is deliberately strict and is true only for a safe classification.

## Current blockers
- invalid GameState preview,
- duplicate Player IDs,
- duplicate Team IDs.

## Current warnings
- malformed/missing legacy array fields,
- Contracts without permanent IDs,
- Transactions without permanent IDs,
- DraftPicks still awaiting permanent identity migration,
- legacy fields whose authoritative GameState destinations remain deferred.

## Important consequence
The current real prototype is expected to remain warning-bearing because Contract, Transaction, and DraftPick identity migration is known Phase 1 debt. This is intentional. Mission 9 exposes the debt rather than laundering it into the new save architecture.

## Boundary
This module is diagnostic only. It performs no storage read/write, no automatic ID assignment, no conflict repair, no deletion, and no app integration.

## Next controlled step
Phase 2 Mission 10 should define deterministic migration identity assignment for one bounded mutable-record family, beginning with Contracts or Transactions. DraftPicks should remain deferred until source authority and persistent identity are resolved.

## Exit gate
Mission 9 is complete when migration previews receive an explicit safe/warning/blocked classification, structural blockers are separated from known migration debt, diagnostics are test-covered, and no persistence side effects occur.
