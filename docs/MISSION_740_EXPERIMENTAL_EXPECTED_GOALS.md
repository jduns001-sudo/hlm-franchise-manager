# Mission 740: Experimental expected-goals model

This isolated, read-only research model consumes Mission 739's validated roster rating preview. When both six-player units have complete contract/injury evidence, it computes fractional **expected goals**, not real game scores:

- `d = clamp(homeMeanRating - awayMeanRating, -30, 30)`
- `homeExpectedGoals = round3(2.5 + 0.2 + 0.035 * d)`
- `awayExpectedGoals = round3(2.5 - 0.035 * d)`

These constants are initial fictional experimental assumptions, not NHL-calibrated estimates. When evidence is incomplete both outputs are null. No RNG, scoring, game result, standings, player statistics, save writes, or UI integration. Safety flags for eligibility, simulation, score calculation, game results, mutation and persistence remain false. No Front Office, Phase 10 demo or Phase 11 import changes.

Run `node hlm-phase10-experimental-expected-goals.test.js`.
