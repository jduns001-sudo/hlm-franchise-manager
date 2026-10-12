# Phase 10: Playable Franchise Loop

Status: Planning baseline. Phase 9's 700 mission-labelled diagnostics regression checks have been merged; this does not certify complete gameplay.

## Objective
Deliver a verifiable single-season franchise gameplay loop from team selection through games, standings, playoffs, offseason, and save/reload. Preserve existing franchise saves and data formats.

## Delivery gates

1. **Runtime inventory:** Map existing calendar, simulation, roster, standings, contracts, draft and persistence modules to actual Front Office routes. Classify each as working, partial or absent based on integration tests, not filenames.
2. **Season bootstrap:** Select a controlled team, load a canonical universe, initialize league calendar and roster state, and surface actionable errors for invalid data.
3. **Advance one day:** Deterministically advance date, execute scheduled events once, record transactions and generate a durable save snapshot.
4. **Simulate a game:** Resolve a scheduled matchup, update player/team statistics and standings atomically, prevent duplicate results and support seeded repeatability.
5. **Manage franchise:** Edit lines/depth chart, make roster and contract decisions with validation and cap checks, and observe effects in the next simulated game.
6. **Complete season:** Determine playoff seeds, run best-of-seven series, award championship, transition through offseason and draft, then begin next season.
7. **Persistence and recovery:** Save/reload at each boundary; verify rollback or recovery from interrupted writes and maintain backward compatibility with existing saves.
8. **Mobile acceptance:** Test the live GitHub Pages Front Office on a narrow viewport with team selection, calendar advance, gameplay feedback and accessible controls.

## First implementation slice

Build a browser-facing **Gameplay Readiness** audit that reports the actual active game-state source, controlled team, current season/date, scheduled games, and save availability without mutating data. Add tests for missing/invalid state and a valid loaded franchise. Use that report to identify the first missing connection for the advance-day flow.

## Quality bar

- No fabricated gameplay results or invented completion percentages.
- Automated tests for happy path, invalid input, duplicate execution and save/reload.
- CI green before merge; user-facing acceptance checks after deployment.
- Avoid unnecessary changes to existing Phase 9 diagnostics and legacy saves.

## Milestone definition

Phase 10 is complete only after an end-to-end playable season is demonstrated, not when a predetermined number of test labels is reached.
