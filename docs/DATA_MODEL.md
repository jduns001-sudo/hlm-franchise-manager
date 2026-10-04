# HLM Phase 1 — Authoritative Data Model & Permanent IDs

Principle: **Data → Game State → Simulation → AI → UI.** The UI is never a source of truth.
This document is the Mission 1 foundation. It is a specification plus a read-only validator
(`node hlm-data-validate.js`). `app.html`, the JSON files, and saved state are unchanged.

## Permanent-ID rules
1. IDs are permanent: never reused, renumbered, or derived from names/abbreviations.
2. Player ID: positive safe integer, from `hlm-universe.json`. Custom players get new IDs that never collide with Universe IDs.
3. Team ID: integer from the Universe 277-team table. Teams are never matched by abbreviation (39 abbreviations are shared).
4. Sentinel team IDs `-1` (no team / free agent), `0` (unassigned/prospect pool), `100` (retired/other) are distinct and are never treated as equivalent or as teams.
5. A positive `teamId` not in the team table is an *external organization* (junior/minor/other), not a franchise team and not a free agent.
6. DraftPick IDs do not exist yet. Future format: `pick:<year>:<round>:<originalTeamId>[:<n>]`, where `n` disambiguates collisions (21 collisions today). Original team is immutable; owner is mutable state.
7. Contract and Transaction IDs are generated once at creation and are never recycled.

## Canonical entities (fields; `*` = required)
- **Player**: `id*`, `first*`, `last*`, `birthYear*`, `nation`, `shoots`, `height`, `position`(s), `ovr`, `potential`, `retired*`, `teamId*` (see rules 4–5), `custom`.
- **Team**: `id*`, `name*`, `abbr` (display only), `conf`, `division`, `league`.
- **DraftPick**: `id*`(future), `year*`, `round*`, `originalTeamId*`, `currentOwnerId*`, `tradeHistory[]`.
- **Contract**: `id*`, `playerId*`, `teamId*`, `aav*`, `years*`, `season*`, `status*` (Offer Pending/Signed/Active/Expired).
- **Transaction**: `id*`, `type*`, `date*`, `playerIds[]`, `teamIds[]`, `note`.

## Authoritative sources (base data; read-only at runtime)
| Field | Authority | Notes |
|---|---|---|
| Player identity, birth year, nation, team assignment | `hlm-universe.json` | Roster `teamId` is historical and must not override it. |
| Overall / potential / positions | `hlm-roster-2026.json` overlay, then `PLAYER_FIXES` | Universe `ovr` can be a jersey number (e.g. Malkin 71 vs 86). Target: a single reconciled record. |
| Draft pick ownership | roster `draftPicks` (currentTeamId + tradeHistory) when populated, else Universe picks | |
| Franchise changes (signings, offers, waivers, overrides) | Browser state | Mutable state layered on top; never written back into base data. |

## Precedence for duplicate roster rows (target rule; not applied yet)
Duplicate rows must be resolved explicitly (e.g. highest `latestSeason`), never by file order. The overlay still uses last-row-wins; changing it is a later, separate mission.

## Baseline (`node hlm-data-validate.js`, Data v9)
Universe players 11,517 (unique); roster rows 7,379 / 6,954 distinct IDs (425 duplicated, 329 with conflicting Overall); 4,563 Universe players lack a roster row; 11,517 lack a position; active players: 2,998 on franchise teams, 3,756 on external organizations, 128 sentinel; 554 Universe + 330 roster picks have no ID. Exit code is non-zero only for hard errors (none today).

## Out of scope for Mission 1
GameState, new save system, calendar, simulation, player development, CPU AI, UI redesign, fixing duplicates, wiring the validator into `app.html`.
