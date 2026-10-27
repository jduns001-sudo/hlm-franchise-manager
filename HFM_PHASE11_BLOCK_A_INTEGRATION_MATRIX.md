# Hockey Franchise Manager: Phase 11 Block A integration matrix

Status: **experimental audit and consolidated acceptance**, not a release certification. Source of truth: GitHub `main` at `8f13ffc6dd4964dd86e920dc1a61dcf5465fbd29`. All original Master Specification features remain in scope.

## Branch ancestry and deployment
- Production-facing `main` remains the deployed-code baseline, but GitHub Pages deployment and real phone behavior must be independently verified.
- This Block A branch is based directly on `main`; it deliberately does **not** merge the unmerged CPU trade consent stack.
- CPU consent chain: PR #1668 (M1641) -> #1669 (M1642) -> #1670 (M1643) -> #1671 (M1644) -> #1672 (M1645) -> #1673 (M1646), each targeting the preceding experimental branch. All must be reviewed independently before integration.
- Other draft CPU fixture, trade, and mobile CI branches have different ancestry; do not combine by cherry-picking without dependency and provenance review.

## Entry points and state
- `index.html` redirects to `app.html` normally; `?tools=1` exposes isolated test entry points.
- `hlm-phase11-isolated-single-game.html` is a separate playable experimental season interface.
- `hlm-phase11-gameplay-bridge.html` stages isolated gameplay, not a production migration.
- Production Front Office key observed in acceptance fixtures: `hlm_front_office_v8`.
- Isolated season save key in the source: `hlm-phase11-m1340-isolated-single-game-v1`.
- Gameplay bridge key: `hlm-phase11-m1207-isolated-gameplay-v1`.
- Save namespace separation alone is not release readiness; browser two-tab, stale-write, reload, migration and no-overwrite tests remain required.

## Source-backed gameplay and acceptance evidence
- Franchise creation: `hlm-phase11-new-franchise.js` validates a canonical real-universe NHL roster and source-backed future picks, excluding ambiguous records.
- Game state and persistence: `hlm-game-state.js`, `hlm-phase10-browser-storage.js`.
- Game/day simulation and standings: `hlm-phase10-apply-game.js`, `hlm-phase10-simulate-day.js`, `hlm-phase10-standings.js`.
- Playoffs/championship/offseason: `hlm-phase10-season-playoffs.js`, `hlm-phase10-playoff-simulation.js`, `hlm-phase10-season-finalization.js`, `hlm-phase10-complete-offseason.js`.
- Controlled GM approval and isolated saves: `hlm-phase11-isolated-single-game.js`.
- Multi-season continuity acceptance includes two championships, contracts, draft selections, save reload, stale-write rejection and production sentinel checks. It is a constructed four-team fixture, **not** proof of a full NHL universe playthrough.

## Feature-preservation checklist
The 30-section Master Specification remains authoritative. Track each feature as Planned / Code Exists / Integrated / Browser Tested / Release Verified. Do not convert Code Exists into Complete.

| Area | Current evidence | Missing release proof |
|---|---|---|
| Franchise setup and real roster | Canonical source import and tests | End-user real-universe mobile flow |
| Lines, roster, injuries, goalies | Isolated season GM gates | Full season effects and user acceptance |
| Schedule, games, standings | Existing simulation and acceptance | Complete real-league balance and continuity |
| Playoffs, champion, offseason | Multi-season acceptance | Long real-universe lifecycle |
| Contracts, draft, prospects | Two-season test and source pick import | Full draft/scouting/contract gameplay |
| Trades and CPU organizations | Draft experimental branches and safeguards | Authenticated CPU decisions and safe integrated settlement |
| Staff, coaching, morale, personality | Original scope preserved | Implementation/integration and acceptance audit |
| Finances, ownership, leagues, affiliates | Modules and previews exist | Unified authoritative state and behavior |
| Media, awards, history, records | Partial modules and archives | Decades of persistent cross-system history |
| AI front office, custom universes, commissioner | Master Specification requirements | Fully integrated, GM-controlled acceptance |
| Mobile, accessibility, offline, stress | Selected Chromium and CI tests | Real-device testing and long-run reliability |

## Next playable milestone
1. Run consolidated Node integration acceptance, preserving all production keys.
2. Add a browser journey test from franchise selection through regular season, playoffs, offseason, next-season reload, with explicit GM decisions and no-save cancellation.
3. Add real-universe CPU schedule/roster/contract/draft/finance consistency checks, then run a 20-season and 100-year stress test at appropriate scope.
4. Identify missing systems from the Master Specification and implement them in substantial domain blocks. A first playable milestone must not be called a feature-complete game.
5. Do not merge, publish, or activate production without explicit user approval.
