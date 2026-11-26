# V2-02 Team management

The opt-in entry remains `hlm-v2-preview.html?a22Navigation=1`. Without that literal opt-in the authoritative application is not started. The iframe retains the serving origin; it is not a storage-isolation boundary. Any future preview release requires a separate origin from production.

`hlm-v2-team.js` adds a source-backed roster, read-only player profiles and a starting-unit/depth presentation. It reads the existing atomic repository without adding command APIs. Native lineup controls retain their nodes, event handlers, validators, review, native confirmation and transactional authority. Recommendations and manual edits remain local until the original confirmed save succeeds. Deployment and game-day approval remain separate commands.

The roster uses saved permanent IDs and controlled-team ownership. Missing ratings, positions, contracts and detailed attributes remain unavailable rather than inferred. A missing contract record does not establish free-agent status. Experimental player statistics are labeled synthetic; they do not establish actual ice time. Filters and sorting do not modify roster state.

The Lines view distinguishes `extensions.phase11LineupPlan`, depth ordering, approved skaters and game-day approval. It reads the authoritative record on startup and existing snapshot events. The evidence disclosure exposes origin, database/store/key, franchise identity, epoch, revision and plan status without writing or exporting save data. Native review and confirmation remain the only save route.

## Samsung persistence investigation

The reported physical-device discrepancy was not reproduced. A disposable Pittsburgh plan, including six starting slots and depth order, survived native confirmed persistence and reload. Legacy shell availability labels derive from display snapshots, whereas the plan exists in the authoritative extension. These are distinct read paths; missing display metadata is a potential failure surface, not proof of the actual Samsung cause or data loss. The new Team view reads the authoritative plan directly and remains correct when legacy availability text is unavailable. No user Samsung storage was accessed, corrected or migrated.

## Verification

Focused Team Node tests cover source projections, saved-plan status, IDs, ownership, missing data and immutable input. Chromium exercises five viewport widths, roster/profile navigation, native draft recommendations and manual overrides, review/cancellation, exact persisted payload, reload, real two-tab CAS rejection, lost-acknowledgement reconciliation and separate reviewed skater deployment. Production sentinels, dates, rosters and unrelated state remain unchanged. Existing game-day controls are tested separately. See the external mission evidence for exact commands and measured results.

No save schema, storage namespace, simulation formula, ratings, source positions or production application file was changed. New read-only controls recover availability only after the original authority reports an active, non-busy state; authoritative native controls are never reenabled by this presentation layer.
