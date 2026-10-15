# Hockey Franchise Manager: full-game delivery gates (October 2026)

This document is an evidence-based implementation map, **not** a certification that the full game is finished. Mission numbers and test counts do not measure game completion.

## Existing verified foundations
- Existing `app.html` Front Office and persistent schema-7 IndexedDB save (`hlm_front_office_v8`), with franchise navigation and existing import/export behavior.
- Experimental Phase 10 fictional four-team 28-day/56-game season, standings, best-of-seven playoffs, isolated save and backup/restore (see `PHASE10_RELEASE_READINESS.md`).
- Phase 11 opt-in simulation, finance validation, roster-import staging, recovery and browser tests. Production activation remains OFF and is not authorized.

## Full-game release workstreams (all must pass)
1. **Real-universe import and migration:** full production universe, controlled-team retention, draft picks, contracts, lines, player metadata, cross-tab conflicts, interrupted save recovery and durable backup.
2. **Playable Front Office loop:** team selection, schedule/day advancement, realistic roster-based games, statistics, standings, best-of-seven playoffs, offseason, draft, next season and save/reload in the actual UI.
3. **Franchise management:** contracts/cap, waivers, trades, free agency, roster movement, injuries, player development, morale, scouting and staff with authoritative state transitions.
4. **Autonomous league:** CPU organizations make valid roster, contract, trade, draft and budget decisions; player GM has final authorization for owner-franchise actions.
5. **Long-term universe:** prospects, generated draft classes, career development, retirements, awards, records, transactions, trade trees, franchise histories, finances and multi-season continuity.
6. **AI GM:** actionable recommendations and explanations for roster, trades, contracts, cap, draft, staff, scouting and long-range planning, never silent GM decisions.
7. **Release acceptance:** complete-real-universe, multiseason, browser/mobile, backup/rollback, concurrency, performance and published Pages smoke tests, with explicit user approval before production activation.

## Integrated readiness audit
`hlm-phase11-integrated-season-readiness.js` is a read-only owner/CPU franchise state audit. It composes existing Phase 10 readiness and checks unique team/player/game IDs, team references, schedule counts and finance snapshot coverage. It **does not** prove complete gameplay or mutate saves. Dedicated CI runs its regression suite.

## Acceleration policy
Favor cohesive gameplay workstreams with end-to-end browser tests over one-field micro-PRs. Prioritize real roster import and actual Front Office playable-loop acceptance before expanding isolated financial validators. Keep the current production application and saves untouched until all cutover gates and explicit GM approval are satisfied.

## Progress reporting
A full-game completion percentage is an approximate planning estimate only until a feature-by-feature acceptance matrix and release tests are complete. Distinguish implemented experimental modules from verified production gameplay; do not use mission count as a completion numerator.
