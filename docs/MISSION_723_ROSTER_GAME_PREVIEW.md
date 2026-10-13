# Mission 723: Roster-backed game preview

Adds a pure, deterministic **non-official preview** based on Mission 722's six-slot proposals. It requires two distinct known positive team IDs and complete illustrative units. Each team's skater and goalie overall ratings influence a bounded 0–9 projected score. A seeded integer mixer provides repeatability. A tie can remain a tie; overtime and real game outcomes are not claimed.

Exports `createRosterBackedGamePreview(state, homeTeamId, awayTeamId, seed=1)`. Invalid team IDs and seeds, or incomplete units, raise explicit errors. No season advancement, roster selection authorization, official results, player statistics, persistence, browser storage or UI wiring. All safety flags false.

This is not the live Phase 10 simulation and does not alter the current demo. Follow-up work must define game-ready lineups, valid results and authoritative simulation integration before this can influence franchise games.

Run `node hlm-phase10-roster-game-preview.test.js`.
