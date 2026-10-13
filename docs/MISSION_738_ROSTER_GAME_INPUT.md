# Mission 738: Roster-backed game input contract

Mission 738 turns Mission 737's two-team matchup preview into a detached game-input descriptor. It contains permanent team/player IDs, selected rating totals and counts, explicit missing slots, and contract/injury blockers. A fully populated, evidence-complete input is **not** certified game eligibility and is **not** permission to simulate.

`createRosterBackedGameInput(state, homeTeamId, awayTeamId)` rejects invalid or unknown team IDs via Mission 737. The result carries `evidenceComplete`, per-team `inputComplete`, and safety flags `eligibilityCertified:false`, `simulationAuthorized:false`, `scoreCalculated:false`, `sourceStateMutated:false`, `persistencePerformed:false`. No randomness, scores, persistence, browser UI or save changes.

Tests exercise both complete and missing-contract evidence, deterministic and detached output, explicit blockers, safety invariants, and invalid IDs.

Run `node hlm-phase10-roster-game-input.test.js`.

Next mission: develop an explicitly isolated **experimental** score model with opt-in synthetic fixtures only. Do not use real franchise saves or claim actual league eligibility until certified rules exist.
