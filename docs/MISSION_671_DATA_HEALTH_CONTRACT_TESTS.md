# Mission 671: Franchise data health contract tests

This mission adds regression tests for the existing Mission 670 read-only franchise data health report. **No production modules are changed.**

## Scenarios
1. **Empty universe:** zero teams and players, no fabricated candidates, and a valid empty canonical snapshot.
2. **Missing organization references:** known team membership remains distinct from unresolved positive team IDs and the `-1`, `0`, and `100` sentinels. Advisory warnings remain separate from canonical errors.
3. **Duplicate Universe player IDs:** canonical identity deduplication does not erase `DUPLICATE_UNIVERSE_PLAYER_ID` or `ROSTER_PLAYER_MISSING_UNIVERSE` diagnostics; counts do not double-count a player.
4. **Diagnostic preservation:** report error/warning collections and summary values equal the existing pipeline and validation summary, and modifying a returned report does not change inputs or later reports.

All cases assert `simulationAuthorized === false`, nonmutation, and no persistence. Tests do not invent active-roster rules or authorize gameplay.

Run `node hlm-franchise-data-health-contract.test.js`. The Mission 671 GitHub Actions workflow runs this test alongside prior readiness and canonical foundation tests. Front Office, Phase 10 demo, browser saves, and source data are untouched.
