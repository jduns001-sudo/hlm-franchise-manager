# Phase 10 Experimental Roster Season Lab: Release Readiness

Updated: 2026-10-13. Scope: **experimental roster simulation**, not the full Hockey Franchise Manager.

## Verified acceptance evidence

- PR #755 (Mission 754): save integrity and validated backup import/export; six workflows green.
- PR #756 (Mission 756): browser backup controls and restore regression; six workflows green.
- PR #757 (Mission 757): cancel-import protection and confirmed restore; five workflows green.
- PR #758 (Mission 758): reject backups from other franchise save IDs; seven workflows green.
- PR #759 (Mission 759): durable main-branch/manual release workflow; Foundation green before merge.
- PR #760 (Mission 760): Foundation and Phase 10 Main Release Acceptance workflows green. The release acceptance workflow contains two successful jobs: `release-regression` and `pages-smoke`.

Public lab: https://jduns001-sudo.github.io/hlm-franchise-manager/phase10-roster-lab.html

The Pages smoke job fetched the public HTML and browser JS bundle from a GitHub Actions runner, verified page and bundle markers, and passed. This confirms asset availability, not end-user visual behavior on all devices.

## Implemented in experimental lab

- Four **fictional** teams, six players per team, roster-weighted regular-season simulation across 28 days and 56 games.
- Standings, synthetic regular-season player goal leaders, readable team/player names and recent results.
- Best-of-seven playoffs through a champion.
- Isolated browser save key, page reload persistence, export/import backup controls with replacement confirmation.
- Schema validation, size checks, wrong-franchise backup rejection, storage-write failure tests, and legacy demo save isolation.
- Browser controller, complete-season, bundle reproducibility and save-integrity automated regressions.

## Not certified or not implemented

- **Not** an official 2026-27 NHL database or realistic full league roster simulation.
- **Not** a fully integrated Front Office save, AI GM, trade, contracts, staff, scouting, cap, draft, injuries/morale or long-term franchise ecosystem.
- Goal leaders are synthetic regular-season goals, not a complete official stat engine with assists, goalie stats or playoff player stat accounting.
- GitHub Pages smoke verifies public assets, not real mobile usability, service-worker caching, or every UI interaction in a real browser.
- The browser's localStorage can be cleared by browser/device settings. Users should export backups before clearing browser data.
- No claim that the **entire** Hockey Franchise Manager game is 98% complete.

## Manual acceptance checklist

1. Open the live roster lab in Chrome on Android; hard-refresh if a stale cached bundle appears.
2. Create a roster season; confirm four fictional teams and 0/56 completed games.
3. Advance one day; verify 2/56 games, readable results and goal leaders.
4. Export backup; copy JSON to safe storage outside the browser.
5. Advance another day; paste saved backup, decline overwrite and confirm the newer season remains.
6. Repeat import and approve overwrite; verify earlier progress returns.
7. Finish regular season (56/56), start best-of-seven playoffs and simulate to a named champion.
8. Reload page; confirm the champion persists. Check the original Front Office and demo remain unaffected.
9. Import invalid JSON or a foreign save; verify an error and unchanged current save.
10. Re-run `Phase 10 Main Release Acceptance` in GitHub Actions after future deployments.

## Release decision and next priorities

**Decision:** Experimental Phase 10 lab is **automated-acceptance-ready** with public assets verified. A full user-facing release sign-off requires manual mobile acceptance and a product decision on its experimental label.

**Next phase, in order:**
1. Replace fictional test data with an explicit import/mapping pipeline for real roster and prospect datasets, without silently mixing with legacy saves.
2. Integrate the simulation behind the Front Office as an opt-in feature with versioned migration and rollback.
3. Expand player stats (assists, shots, goalie saves, playoff stats) and official season history.
4. Implement transactions, contracts, salary cap, trades, drafts and offseason franchise progression.
5. Add AI GM decision support, staff, scouting, development, morale and long-term franchise analytics.
6. Add browser/device compatibility tests, export-as-file UX, save migration tests and deployment health monitoring.

Reference: https://github.com/jduns001-sudo/hlm-franchise-manager/pull/760
