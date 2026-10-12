# Mission 667: Read-only roster readiness diagnostics

## Purpose
`createSimulationRosterReadinessReport(assessment)` consumes a Mission 666 `simulation-roster-eligibility-assessment` and creates a detached team-by-team diagnostic report.

Per team it reports associated, candidate, retired/excluded and undetermined-associated counts; candidate/excluded IDs; and diagnostic issue codes. A team with no confirmed candidates receives `NO_CONFIRMED_TEAM_CANDIDATES`. Retired and undetermined associated players are separately flagged. All teams explicitly receive `GAME_ELIGIBILITY_NOT_ESTABLISHED` and `ROSTER_REQUIREMENTS_NOT_DEFINED`.

The report also groups nonretired unresolved player references by their original organization classification, preserving distinct -1, 0, 100, and external positive IDs.

## Important limitations
`rosterSufficiency: 'unknown'` and `gameReady: null` are deliberate. No minimum roster size, position quotas, goalie requirements, league membership, contract status, injuries or active-lineup rules have been defined. A nonzero candidate count is **not** sufficient to certify a team as game-ready. No player is automatically assigned, selected, or made eligible.

This standalone module is not wired to the UI or gameplay. The Front Office, Phase 10 demo, browser saves, source data, and earlier bridge behavior remain unchanged.

## Verification
`node hlm-simulation-roster-readiness.test.js` tests populated, retired-only and empty teams, distinct unresolved categories, summary counts, input nonmutation, output detachment and invalid inputs.
