# Mission 731: Roster game rules preview integration

Composes Mission 725's illustrative roster-backed game outcome proposal with Mission 730's pure regulation/overtime rules calculator. For complete illustrative starter units, the proposed regulation score feeds the calculator, using the existing illustrative tie-break winner solely to choose a preview overtime winner. This does not validate the tie-break as an official league rule.

Export: `createRosterGameRulesPreview(state, homeTeamId, awayTeamId, seed=1)`.

Returns detached regulation score, calculated final score, winner/loser team IDs, overtime status and points, or null calculated result with explicit missing slots for incomplete/unknown teams. The source GameState is never mutated. `gameReady:null` and all authorization, official-result, lineup, simulation and persistence flags remain false.

No actual game is played, saved or recorded. No Front Office, Phase 10 demo, browser saves or gameplay modifications. Next step requires independently validated lineup and league eligibility before any official-result gate can be opened.

Run `node hlm-phase10-roster-game-rules-preview.test.js`.
