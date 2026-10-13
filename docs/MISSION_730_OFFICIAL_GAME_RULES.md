# Mission 730: Pure official game rules calculator

Mission 729 requires concrete, independently tested mechanics before official game results may be authorized. Mission 730 implements a **pure rules calculator** with deterministic regulation winner, single-goal overtime tiebreak, and two-point-win / one-point-overtime-loss standings accounting.

Export: `calculateOfficialGameRules(input)` from `hlm-phase10-official-game-rules-calculator.js`.

Inputs: distinct positive safe integer `homeTeamId` and `awayTeamId`, nonnegative safe integer `homeRegulationGoals` and `awayRegulationGoals`. If regulation is tied, `overtimeWinnerTeamId` must identify one of those teams. Otherwise it must be absent or null. Invalid inputs throw `INVALID_OFFICIAL_GAME_RULE_INPUT` or `INVALID_OFFICIAL_OVERTIME_WINNER`.

Outputs: resolved final goals, overtime flag, winner/loser IDs, home/away standings points, plus fixed false authorization, official-result, simulation, mutation and persistence flags.

This is **not** a game simulator, eligibility engine, verified real-life league rules implementation, standings mutation or official result application. The Mission 729 gate stays blocked. No Front Office, Phase 10 demo or browser save changes.

Run `node hlm-phase10-official-game-rules-calculator.test.js`.
