# HLM Phase 1 — Authoritative Data Model & Permanent IDs

Principle: **Data → Game State → Simulation → AI → UI.** The UI is never a source of truth.

Mission 1 is a specification plus a read-only validator (`node hlm-data-validate.js`).
`app.html`, both JSON files, `service-worker.js` and browser persistence are unchanged.
Everything below marked "current" documents existing behavior; it is not a migration.

Conventions: `*` = required. Types: int, string, bool, enum, ref(Entity), list.

---

## 1. Permanent-ID rules
1. IDs are permanent: never reused, renumbered, or derived from names or abbreviations.
2. **Player ID**: positive safe integer from `hlm-universe.json`. Custom players need new IDs that never collide with Universe IDs.
3. **Team ID**: integer from the Universe team table (277 rows). Never match teams by abbreviation.
4. **Sentinels** `-1`, `0`, `100` are not teams, are absent from the team table, and are never treated as equivalent (see §5).
5. **DraftPick ID**: see §6.
6. Contract, Transaction, Prospect, Staff, Game, Injury and other new records get an ID once at creation; IDs are never recycled. Format is chosen when each system is built.
7. References between entities use IDs only, never names, abbreviations or array positions.

## 2. Canonical entities — core (existing data)

### Player (one canonical record per ID)
- ID: `id*` int (permanent).
- Required: `first*`, `last*` string; `birthYear*` int; `retired*` bool; `teamId*` int (see §5).
- Optional: `nation` string, `shoots` enum L/R, `height` int (cm), `position`/`positions` (position strings), `ovr` int 0–99, `potential` int, `type` string (e.g. TWF), `custom` bool, `age` int (derived from birthYear and season; do not trust as stored).
- References: `teamId` → Team/Organization or sentinel.
- Status: `retired`; contract and draft status are derived from Contract/DraftPick/Prospect records, not stored on the player.
- Validation: id unique across Universe + custom; `birthYear` plausible; `ovr` is Overall, never a jersey number; positive `teamId` not in the team table = external organization.

### Team
- ID: `id*` int. Required: `name*` string. Optional: `abbr` (display only, not unique), `conf`, `division`, `colors`, `cityId`, `founded`.
- Validation: id unique, never -1/0/100.

### DraftPick
- ID: `pickId*` (§6). Required: `league*` int, `year*` int, `round*` int, `originalTeamId*` ref(Team), `currentOwnerId*` ref(Team).
- Optional: `tradeHistory` list, `conditions`, `protection`, `swapRights`, `projectedPosition`, `actualPosition`.
- Status: `AVAILABLE` / `HISTORICAL` (current runtime values). Original team is immutable; owner is mutable.
- Validation: both team refs resolvable; identity unique after occurrence suffix.

### Contract
- ID: `id*` (to be assigned). Required: `playerId*` ref(Player), `teamId*` ref(Team), `aav*` int, `years*` int, `season*` int, `status*` enum (Offer Pending / Signed / Active / Declined / Expired).
- Optional: `freeAgentSigning` bool, `signedAt`, `createdAt`.
- Validation: `aav` > 0, `years` ≥ 1, one active contract per player.

### Transaction
- ID: `id*`. Required: `type*`, `date*`. Optional: `note`. References: `playerIds` list, `teamIds` list, `contractId`.

## 3. Canonical entities — architecture definitions only (not implemented)
Each follows §1 rules. Define only the minimum now.

### League
- ID: `id*` int (Universe uses `league: 0` on picks). Required: `name*`. Reference list: member Team/Organization IDs. Status: active/inactive. Validation: a team belongs to at least one league.

### Prospect
- ID: `id*` (or the Player ID if the prospect is a Player). Required: `playerId*` ref(Player), `draftYear` int. Optional: `rights` ref(Team), `stage`, `draftPickId` ref(DraftPick). Status: Undrafted / Drafted / Signed / Released. Validation: one canonical Player; prospect is a role, not a second Player.

### Staff
- ID: `id*`. Required: `name*`, `role*` enum, `teamId` ref. Optional: ratings, contract ref. Status: employed/free agent/retired.

### Game
- ID: `id*`. Required: `seasonId*`, `homeTeamId*`, `awayTeamId*`, `date*`. Optional: scores, result. Status: Scheduled / Played / Postponed. Validation: teams differ and are valid.

### Season
- ID: `id*` (year or `{leagueId, year}`). Required: `year*`, `leagueId*`. Optional: phase. Status: Planned / Active / Completed.

### Statistics
- Not an entity with its own identity. Records keyed by (`playerId`, `seasonId`, `teamId`, `leagueId`, `gameType`). Required: `playerId*`, `seasonId*`. Stat values are numeric. Validation: references resolve; the same key appears once.

### Injury
- ID: `id*`. Required: `playerId*`, `startDate*`, `severity*`. Optional: `expectedReturn`, `description`. Status: Active / Recovered.

### Finance
- Keyed by (`teamId`, `seasonId`). Required: `capLimit`, `payroll`. Optional: revenue, expenses. Derived values (e.g. cap space) are not stored.

### History
- Append-only record. ID: `id*`. Required: `type*`, `seasonId*`, `date`. Reference: any entity IDs. Never edited; corrections are new records. The current `db.history`, `standingsLog` and Universe `seasons` rows are early forms of this.

## 4. Current entity vs. historical record
- **A canonical Player exists exactly once.** Season, stat, roster-snapshot and history records may be many, and each references the permanent Player ID.
- Historical roster/import rows (`hlm-roster-2026.json` `players`, Universe `seasons`) must never become duplicate canonical Players. 425 repeated roster IDs are snapshots of one player, not 425 extra players.
- No historical rows are deleted. They are kept as records.
- **Future importer/normalization layer (not built):**
  1. Create the canonical Player from the Universe record.
  2. Group roster rows by Player ID and keep each as a historical/season snapshot (for example keyed by `latestSeason`).
  3. Choose the "current" values by explicit rule (latest season), never by file order.
  4. Report conflicts (such as differing Overall for the same season) rather than hiding them.
  5. Rows whose ID has no canonical Player are rejected and logged, never auto-created.

## 5. Team / Organization ID strategy
| Kind | Today | Future rule |
|---|---|---|
| Franchise Team | A positive ID in the 277-row team table. The table does not say which rows are top-level franchises. | Flag explicitly with a level/league field; do not infer from the ID range. |
| Historical Team | Not distinguished. | Use a separate ID or an `active` flag; never reuse an ID. |
| Minor/Junior/Other Organization | Positive IDs, either in the table (244 rows have ID ≥ 101) or not in it (3,756 active players point at IDs like 3515531). | Resolve through an Organization record. |
| Unassigned | `0` (127 active Universe players, mostly 17–18 years old) — exact meaning not formally established. | Keep distinct from the others. |
| Free Agent | `-1` appears as a "no team" value (1 active Universe player, 5,127 roster rows); runtime FA state is derived from rules, not from this value alone. | Keep distinct. |
| Unknown/Legacy | `100` (4,338 Universe players, all retired in the current data; 432 roster rows) — meaning not formally established. | Keep distinct. |

- Keep `-1`, `0` and `100` distinct until their exact meanings are formally established. Do not renumber any current Team ID. Do not identify teams by abbreviation (39 abbreviations repeat).
- Team table gaps: IDs 11, 27, 31, 32 and 33 are absent although other IDs ≤ 33 exist. ID 27 owns 80 Universe draft picks, so those owners cannot be resolved.
- **Future option (not implemented):** a separate `Organization` entity (permanent `orgId`, name, level, league, parent) with `Team` as a season-specific entry of an organization. This may be cleaner than forcing every hockey organization into Team. Decision deferred.

## 6. DraftPick ID strategy review
- **Correction to the Mission 1 draft:** the earlier text proposed `pick:<year>:<round>:<originalTeamId>`. `app.html` already derives and persists `pickId = DP-<league>-<year>-<originalTeamId>-<round>-<occurrence>` (`draftPickIdFor`, `normalizeDraftPicks`), and `draftPickOverrides` are keyed by it. **The existing `DP-` format is the canonical format.** Do not introduce a second one.
- The source files carry no `pickId`; it is generated at load.
- Weakness: the occurrence suffix depends on file order. The Universe has 21 identity keys that repeat (roster picks have 0), so those IDs are stable only while the file order is stable. Reordering or inserting rows would change IDs and orphan saved overrides.
- Recommendation for a later mission: write pickIds into the source data once, then freeze them. Original team must never change; trades change only `currentOwnerId`.
- Also open: Universe owner `teamId` 27 (80 picks) and 3 roster picks with no `currentTeamId`.

## 7. Data authority map (current behavior)
Load order: `hlm-universe.json` → `loadRosterOverlay()` merges roster ovr/potential/positions into Universe players → `initDB()` merges `PLAYER_FIXES`, then `playerOverrides` on top (`{...p, ...fix, ...override}`) → saved browser state.

| Field | PRIMARY | FALLBACK | RUNTIME OVERRIDE | KNOWN CONFLICT |
|---|---|---|---|---|
| Player ID | Universe `id` | Roster `id` (must match) | Custom players added in browser state | Roster IDs repeat (425); roster is a snapshot list, not an ID authority. |
| Player name | Universe `name`/`first`/`last` | Roster `name` (not applied by overlay) | Custom player edits | None observed. |
| Current team | Universe `teamId` | None | `playerOverrides[id].teamId` (signings, trades, waivers) | Roster `teamId` is historical and disagrees with Universe (1,085 active players have roster −1 but a Universe team). Free-agent eligibility rejects a player if EITHER source has a table team. |
| Position | `PLAYER_FIXES` (all 11,517 players) | Roster overlay `pos`, then Universe `position` (absent) | Custom/edited player | Overlay positions are overwritten by `PLAYER_FIXES` in `initDB`. |
| Overall | Roster overlay `ovr` (when > 0) | Universe `ovr` | Custom/edited player | 6,913 players disagree; Universe can hold a jersey number (Malkin 71 vs 86); duplicate roster rows conflict and the last row wins. |
| Potential | `PLAYER_FIXES.potential` (all players) | Roster `potential`, then Universe | Custom/edited player | `PLAYER_FIXES` overrides the roster potential after the overlay. |
| Player type | Universe `type` | Roster `type` (not applied) | None | Not reconciled. |
| Contract | `db.contracts` (browser state) | Universe `aav`; roster `aav` for display only | Contract edits / signings | Roster `contracts` array is empty; Universe `aav` is a season snapshot; no single source. |
| Draft status | `db.draftPicks` status (derived from year vs season) and `db.prospects` | Universe `rookies` (raw rows), `draftYear` / `birthYear + 18` for eligibility | `draftPickOverrides`, `extraDraftPicks` | No Player-level draft field; rookies are raw strings. |
| Retired status | Universe `retired` flag | `retiredIds` list (all consistent with the flag in current data) | None | Not changed at runtime. |
| Draft pick ownership | Roster `draftPicks` (when populated) | Universe `draftPicks` | `draftPickOverrides[pickId]` | Universe owner IDs missing from the team table (80); roster owner missing (3). |
| Controlled team | `db.settings.controlledTeamId` (browser state) | None | User selection | None; there is no data-file authority. |
| Lines | `db.lines` (browser state) | None | User edits | May reference players who later move teams. |
| Depth chart | `db.depth` (browser state) | None | User edits | Same as lines. |
| Free Agent eligibility | Derived by `isFreeAgentPlayer()` | None | `playerOverrides` (signed players), `db.waivers`, `db.contracts` | Uses both Universe and roster team assignments; empty pool is correct for Data v9. |

## 8. Validator review (`hlm-data-validate.js`, read-only)
It only reads the two JSON files with `readFileSync`. It never writes, repairs, renumbers, dedupes, changes ownership or touches browser state, and it does not load `app.html`.

| Check | Status |
|---|---|
| Duplicate Universe Player IDs | Detected (error) |
| Duplicate roster Player IDs | Detected (warning) |
| Conflicting duplicate roster records | Detected for `ovr` and `teamId`; other fields are not compared |
| Invalid/missing Player IDs (Universe and roster) | Detected (error) |
| Roster IDs absent from Universe | Detected (error) |
| Duplicate Team IDs | Detected (error) |
| Sentinel IDs inside the team table | Detected (error) |
| Positive team IDs not in the team table | Counted for active players (not an error) |
| Sentinel Team IDs | Counted per value for active players |
| Duplicate team abbreviations | Detected (info) |
| Missing DraftPick IDs | Detected (info; source files have none) |
| Duplicate proposed DraftPick identity | Detected for Universe and roster picks (warning) |
| Pick team references | Original team and owner checked against the team table; missing owners counted |
| **Cannot be checked safely** | Whether a table team is an NHL franchise; which team a sentinel really means; which of two conflicting duplicate roster rows is right; whether a pick owner is correct; browser state (the validator never reads it). |

Baseline (Data v9): see the output of `node hlm-data-validate.js`; it exits non-zero only for hard errors (none today).

## Out of scope for Mission 1
GameState, new save system, calendar, simulation, development, CPU AI, UI redesign, fixing duplicates, the importer, wiring the validator into `app.html`.
