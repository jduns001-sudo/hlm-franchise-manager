# Phase 2 Mission 7 — Automated Foundation Test Gate

## Purpose
Turn the accumulated Phase 1 and Phase 2 synthetic tests into an executable repository gate before runtime integration or legacy migration grows.

## Local command
`npm test` runs the existing standalone test files in sequence using Node.js and requires no third-party runtime dependencies.

## Continuous integration
The Foundation Tests workflow runs on pull requests and pushes to main using Node 20.

The gate currently covers:
- canonical player registry,
- player field authority resolver,
- canonical player snapshot,
- Team reference registry,
- mutable record identity,
- DraftPick identity audit,
- Phase 1 readiness audit,
- GameState envelope,
- GameState serialization,
- save envelope,
- in-memory save repository,
- isolated browser save adapter,
- save export/import.

## Boundary
This mission does not modify app.html, game data, browser state, save migration, simulation, AI, or UI behavior.

## Rule going forward
Runtime integration should not advance while the automated foundation gate is red. New standalone foundation behavior should add or update focused tests and join the gate.

## Exit gate
Mission 7 is complete only when the workflow actually executes on the pull request and the Foundation Tests job passes. Merely creating the workflow file is not sufficient.
