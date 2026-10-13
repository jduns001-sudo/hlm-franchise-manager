# Mission 725: Roster-backed game outcome proposal

A **read-only illustrative outcome** composed from Mission 724 readiness and Mission 723 roster-backed score preview. Export: `createRosterBackedGameOutcomeProposal(state, homeTeamId, awayTeamId, seed=1)`.

For complete illustrative six-slot lineups, this proposes a regulation score, winner and loser by permanent team IDs, and a deterministic tie-break if the preview is tied. Tie-break parity uses the seed and both team IDs; it is **not** an approved overtime or shootout rule. Missing teams or incomplete proposals return no outcome with missing-slot diagnostics.

`gameReady:null` and all authorization, official-result, mutation and persistence flags remain false. This is **not** official game simulation. No scores are written to GameState, standings, season history, browser saves or UI. Existing Front Office and Phase 10 demo remain unchanged.

Tests exercise 60 seeds, ties, deterministic outcomes, incomplete/unknown teams, invalid input, source immutability and detached output. Run `node hlm-phase10-roster-game-outcome-proposal.test.js`.
