# V2-03 competition, draft and scouting

Entry: `hlm-v2-preview.html?a22Navigation=1`. Default-off behavior and the original isolated authority remain unchanged. The visual entry now waits for the original asynchronously initialized navigation and lineup controls. No iframe-based storage boundary is claimed; any release still requires an origin separate from production.

## Architecture

`hlm-v2-competition.js` owns readonly projection and presentation only. It reads `HLMIsolatedAtomicSave.create({indexedDB}).read()` at startup and existing `hlm:a1-state` snapshots. Sequence tokens discard superseded reads. It adds Season subviews for Game Center, standings, schedule/results and playoffs; Moves subviews for Draft Center, scouting, pick transfers and prospect contracts. Existing native DOM controls are moved, never cloned. IDs, listeners, manager reviews, native confirmation, atomic persistence, receipts and error recovery remain authoritative. Team-owned controls stay in Team. Route adapters preserve existing focus destinations and reveal new panels without authorizing a command.

Game selection changes the existing selector and dispatches its existing change event, invalidating the prior review. Scheduled rows open review controls without executing them. Final scores come only from saved final records. The standings engine is reused; group filtering never reranks rows. Game-day approval and simulation remain separate GM decisions. Planned skaters are not presented as observed ice time or participation.

## Membership evidence

`hlm-universe.json` includes numeric conference strings and blank divisions for the canonical clubs. `hlm-roster-2026.json` does not supply named membership. The canonical importer does not persist named membership. No verified code-to-name dictionary was found in the actual source or authority documentation. Therefore numeric codes are not interpreted and current bundled new franchises keep named conference/division filters disabled. Complete explicit named saved membership enables the existing seven groups. Known conference/division contradictions disable grouping; no state is patched, migrated or enriched from assumptions. League standings remain available.

## Draft and scouting boundary

The Draft Center reads `assets.draftPicks` and `universe.prospects`, preserving pick ownership and permanent prospect IDs. Duplicate/missing identities are excluded from the display with a warning; native authority independently validates selections. Prospect inspection exposes recorded identity, position, age, nationality and rights only. Hidden actual ability/potential is not repackaged as scout estimates. A user may send the selected prospect to the existing native draft review. Only original native confirmation can save draft rights; signing is a separate reviewed command.

The bundled universe and roster snapshots contain no prospect class; Pittsburgh's canonical isolated import currently has no verified owned picks. Those are truthful empty states, not a completed draft pipeline. The scouting foundation and intelligence modules return nonpersistent report/assignment values and are not connected to an authoritative saved report store or command. The scouting interface therefore permits saved prospect identity/rights inspection and clearly disables assignments/report generation. No fictional prospects, ratings, confidence, scouts, reports, rankings or lottery order are introduced. Enabling persisted scouting requires a separately designed existing-authority integration; V2-03 does not invent a schema or write path.

## Tests and evidence

The new Node projection suite covers real 32-team/992-game data, grouping, explicit named membership, contradictions, zero scores, duplicate identities, missing data and source immutability. New Chromium tests cover five viewport widths; untouched receipts during navigation, missing prerequisites, real source-backed native approval/cancellation and one explicitly confirmed disposable game, reload and truthful postgame evidence. A separate explicitly labeled disposable import fixture verifies named membership, hostile prospect text safety, native draft review/cancel/confirmation, rights-only save and reload. It is not included in screenshot evidence or application data.

Existing V2-02 Chromium tests retain real two-tab CAS races and lost-acknowledgement reconciliation. V2-01 regression runs from an external temporary copy with selectors updated only for the new subview destinations; original test files remain intact. Native game-day feedback and focused standings, draft, scouting, transactional and atomic tests are also checked. All tests use disposable storage; no Samsung save or deployed preview is accessed.

Screenshots in the mission's external evidence directory show the implemented source-backed Pittsburgh interface, including honest unavailable draft/scouting data. Visual acceptance and physical Samsung testing remain owner tasks. No production, engine, save schema, scoring formula or source data file was changed.
