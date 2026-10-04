# Phase 2 Mission 25 — Runtime Persistence Integration Audit

## Purpose
Map the currently verifiable runtime persistence surfaces before any new GameState code is connected to the live Front Office.

## Confirmed runtime surfaces
- `app.html` is the main application and contains substantial JavaScript/application logic.
- Repository instructions identify `initDB()`, `openStateDB()`, state migration, local storage, franchise settings, player loading, team loading, and roster loading as critical/high-risk initialization areas.
- A previous initialization change caused a major regression affecting navigation, Controlled Team selection, roster screens, and Front Office initialization. Runtime integration must therefore remain minimal and reversible.
- `hlm-roster-import.js` uses legacy localStorage key `hlm_tracker_v3` and import flag `hlm_roster_imported_2026_v2`.
- The importer preserves legacy seasons, awards, transactions, prospects, draftClasses, gmSettings, contracts, snapshot, and franchiseName while replacing players/teams/draftPicks from the roster import.
- `index.html` redirects to `app.html`.
- `manifest.json` also starts at `app.html`.
- `service-worker.js` cache `hlm-front-office-v7` includes `app.html` in the application shell.
- The new Phase 2 browser adapter uses the separate `hfm_game_state_saves_v1` namespace.

## Repository inspection limitation
The GitHub file endpoint currently returns empty content for the large `app.html` file, while repository search confirms that the file exists and is the main application. Because the exact implementations of `initDB()` and `openStateDB()` cannot be inspected reliably through the current endpoint, this audit does not invent their schema, database names, stores, or write behavior.

## Integration decision
Do not wire Phase 2 migration into `app.html` yet.

The safe next boundary is a runtime readiness/preflight module that can inspect supplied storage without writing it. Live integration should occur only after the exact `app.html` persistence implementation can be inspected or exercised under a reversible, explicit opt-in path.

## Protected invariants
1. Never overwrite or delete `hlm_tracker_v3` during first migration.
2. Never auto-run migration during application startup.
3. Keep `hfm_game_state_saves_v1` isolated.
4. Require explicit user confirmation for migration.
5. Verify the new save after write and roll back a failed new-engine write.
6. Preserve the known-good recovery commit `cf8c5d`.
7. Do not modify `initDB()` or `openStateDB()` without exact inspection.
8. After any eventual runtime integration, physically test application load, navigation, Controlled Team, Roster, Team Rosters, Lines, Depth Chart, Contracts, Draft Picks, Transactions, and save/reload persistence.

## Exit result
Mission 25 is an audit only. No runtime or data files are changed. The new GameState foundation remains disconnected from the live Front Office.
