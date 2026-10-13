# Mission 738: Roster-backed simulation integration audit

## Verified components
- Mission 722 lineup proposals select five skaters and one goalie by rating and position.
- Mission 736 game eligibility evidence joins lineup slots with contract and injury evidence, but leaves gameEligible null.
- Mission 737 matchup preview reports roster ratings and blockers without authorizing a game.
- Mission 723 roster-backed game preview calculates illustrative scores, without applying official results.
- Mission 728 official roster game gate explicitly blocks official game rules.
- Mission 729 official authorization assessment explicitly blocks result application even if capabilities are declared.
- The existing playoff simulator calls simulateGameScore with game/team IDs and a seed, without passing lineup ratings or eligibility evidence.

## Critical path to a playable roster-backed season
1. Define validated league participation, roster registration, cap and medical clearance rules. Do not infer eligibility from missing records.
2. Build a pure roster-backed simulation function that consumes authorized lineup snapshots and a deterministic seed. Keep preview and official result types separate.
3. Add a trusted authorization boundary; do not accept caller-supplied booleans as proof of eligibility.
4. Apply a result exactly once by game ID, updating schedule, team standings and player statistics atomically in a cloned GameState.
5. Route regular-season and playoff gameplay through the same roster-backed engine, with best-of-seven bracket progression.
6. Test complete/incomplete rosters, missing contracts, injuries, duplicate games, deterministic replay, save/restore, playoff advancement and Front Office regressions.

## Release gate
Phase 10 is NOT complete until an end-to-end authorized game advances the season, persists valid results, and passes CI plus smoke tests. Existing previews must remain read-only and must never silently become official results.
