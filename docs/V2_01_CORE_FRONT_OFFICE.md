# V2-01: functional core Front Office

Entry: `hlm-v2-preview.html?a22Navigation=1`. Without the literal opt-in, the entry does not load the runtime iframe, initialize franchise storage, or mount the experimental interface. The V1 visual reference files and original isolated entry remain unchanged.

## Architecture and authority

The new V2 presentation adapter reuses the V1 pure dashboard projection and original SVG icons, overlays shared light-content/navy-navigation styling, and retains the original A1 tab/router controls. It reads the existing atomic repository through readonly `read()` and subscribes to existing `hlm:a1-state` snapshots. A sequence guard prevents older asynchronous reads from replacing newer presentation data.

The original Continue button, native confirmation handlers, transactional manager, game-day review, lineup, selected-game simulation, receipts and recovery are unchanged. The new fixed decision dock contains that same Continue button. Game Center first reuses the original readonly upcoming-game selector to select the displayed controlled-team matchup, then focuses its existing preview control. More links focus existing destinations; they never invoke approval or simulation handlers. There is no new authoritative state, schema, storage namespace or standings engine.

The iframe is a presentation boundary, not an origin/storage boundary. The visual entry deliberately shares the existing isolated authority on its serving origin. Future release requires a distinct HTTPS origin from production and existing previews. No deployment is part of V2-01.

## Data sources

- Identity, date, player membership: saved `meta` and `universe` records, joined by permanent team ID.
- Season: saved `extensions.phase10CurrentSeasonId`, otherwise explicitly unavailable.
- Record, standings and existing engine order: `HLMPhase10.calculateStandings(savedTeams, savedGames)`.
- Upcoming matchup and recent finals: saved scheduled/final `activity.games`; team names resolved by ID.
- Daily Brief, pending decisions, next action: existing page-generated `gm-daily-brief`, `gm-next-action` and snapshot state.
- Alerts: existing projection warnings; no fabricated inbox messages or transactions.
- Roster: saved controlled-team player count.
- Contracts: recorded unexpired owned contracts and their recorded AAV sum, in saved units, following the existing engine's unexpired-contract selection. This is explicitly not complete payroll or cap space.

## Deferred dependencies, not fabricated values

The current canonical new-franchise importer retains team IDs/names/abbreviations but not conference/division membership. Source conference values such as `conf: "1"` lack a verified named mapping; division fields are blank. Therefore all named conference/division filter options are visibly disabled in these saves, with a V2-03 dependency message. When a save contains complete explicit named membership, the same filters are enabled and only filter the existing ordered engine rows. They never rerank teams or infer membership from names/abbreviations.

Cap limit and a complete authoritative payroll are not recorded by the isolated save contract. They remain unavailable. No cap limit, currency conversion, salary or financial authority was invented. Existing Samsung lineup persistence diagnostics remain out of scope.

## Functional scope

This is a functional dashboard, directory/navigation and mobile action foundation. It does not include prototype selector tabs or fixture data. Existing functional roster, lines, game-day, transactions, playoffs and other destinations remain accessible with their existing validation and approvals; completing their dedicated approved screen layouts belongs to later V2 missions.

## Verification

Focused pure and real Chromium/IndexedDB tests cover source-backed data, engine ordering, supported/deferred membership, all five widths, existing route focus, cancellation, explicit approval, one disposable selected-game execution, rapid duplicate-click exclusion, stale-tab rejection, receipt counts, reload and production sentinel isolation. Only disposable browser storage is used. The original A2-108 preview/review focus regression is rerun unchanged.
