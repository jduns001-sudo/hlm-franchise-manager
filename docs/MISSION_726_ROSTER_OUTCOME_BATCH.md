# Mission 726: Roster-backed game outcome batch

Create detached, deterministic illustrative outcome proposals for multiple scheduled games. Export: `createRosterBackedGameOutcomeBatch(state, games, seed=1)`.

Each descriptor supplies a unique `id`, `homeTeamId` and `awayTeamId`. Games preserve input order and use seed + game index for repeatable proposals from Mission 725. Unavailable previews remain null with missing-slot diagnostics. Results are not official. No GameState changes, calendar advance, standings, transactions, season history, persistence, UI, browser saves or Phase 10 demo wiring.

Outputs include gameCount, proposedCount, unavailableCount, proposals, and false resultOfficial/simulationAuthorized/sourceStateMutated/persistencePerformed flags. Tests cover three games, partial roster, empty batch, input errors, repeatability and detachment.

Run `node hlm-phase10-roster-game-outcome-batch.test.js`.
