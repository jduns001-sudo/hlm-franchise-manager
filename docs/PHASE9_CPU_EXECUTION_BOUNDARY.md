# Phase 9 CPU Execution Boundary

The CPU advisory pipeline can produce a verified request without actually executing a transaction. The trade execution gate also produces a candidate package, not a state mutation. These boundaries must not be confused with a production CPU executor.

This integration contract checks the canonical GameState, team identity, advisory preflight, human-controlled team protection, and optional trade candidate gate. It always reports `canExecute: false` until a separately reviewed transaction executor is integrated. No save writes or UI changes are introduced.

Next integration mission: select one canonical transaction type and implement a narrowly scoped isolated candidate-state executor with independent legality verification, rollback behavior, controlled-team protection, and save/reload tests. Do not grant CPU authority by toggling an advisory flag.
