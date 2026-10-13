# Mission 727: Season roster-backed outcome previews

This mission connects the Mission 726 batch outcome proposal to **scheduled games** already present in a validated GameState. It filters games whose status is exactly `scheduled`, preserves their schedule order and dates, and returns detached roster-backed illustrative outcome previews. Completed games are excluded and untouched.

Export: `createSeasonRosterOutcomePreview(state, seed=1)`.

The result reports scheduledGameCount, proposedCount, unavailableCount and per-game proposals, preserving missing lineup slot diagnostics. A missing or incomplete roster produces unavailable previews instead of invented results. Invalid state throws `INVALID_SEASON_ROSTER_PREVIEW_STATE`. Batch seed and game descriptor validation is delegated to Mission 726.

No official game application, standings, date advancement, season history, saves, browser persistence, Front Office or Phase 10 demo modifications. Safety flags remain false.

Run `node hlm-phase10-season-roster-outcome-preview.test.js`.
