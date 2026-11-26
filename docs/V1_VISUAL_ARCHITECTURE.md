# V1 visual development boundary

Open `hlm-v1-preview.html` on a local static server. This is an explicit, isolated visual entry; the existing application entry and all gameplay source bytes are unchanged.

The entry embeds the existing isolated franchise application with its existing experimental navigation opt-in. After that runtime initializes, `hlm-v1-presentation.js` applies `hlm-v1-design.css`, creates reusable visual components, and delegates navigation to the existing controls. `hlm-v1-icons.js` contains original SVG line art. No framework, build tool, external fonts, image service, or dependency installation is needed.

The adapter reads saved state through the existing atomic repository's readonly `read()` method. It subscribes to the existing `hlm:a1-state` event and derives identity, record, standings position, upcoming games and recent results from saved records and the existing standings engine. Missing values remain unavailable. GM inbox content is explicitly derived task guidance, not fabricated communications. Team marks are original monograms, not official team logos.

The original Continue button is retained, including its original listener. Gameplay, preview, roster, lineup, rating repair and native GM-confirmation controls keep their original IDs, listeners and transactional authorities. A2-108 report focus/scroll remains intact. The adapter owns no save, approval or simulation function. Technical output, storage status and the experimental scoring switch use the Advanced Tools dialog. Review evidence remains accessible in the normal workflow.

## Storage and release

An iframe is not an origin or storage boundary. The visual entry deliberately uses the existing isolated storage authority on its serving origin so an existing isolated franchise can load without migration. Production-key separation remains the existing engine's responsibility. Any future public preview must use a distinct HTTPS origin, preserving production and old preview origins. No deployment is part of V1.

## Visual studies

`hlm-v1-prototypes.html` provides seven explicitly labeled nonfunctional fixture studies: Dashboard, More, Roster, Player, Lines, Game Center and Draft/scouting. Fictional identities, ratings, results and scouting information are illustrative only. They never enter live state. These studies establish the V2 visual target; their existence does not imply implementation of those gameplay systems.

## Why this architecture

The current HTML closes over the transactional manager and captures DOM references for navigation. Rebuilding it or moving all controls into a new router would risk save and approval regressions. The opt-in adapter provides a reviewable visual surface without changing authoritative code, existing routes, source data or schemas. V2 can consolidate these presentation components into fully integrated screens after owner approval, keeping the same engine and transaction contracts.

V1 appearance requires owner approval. Chromium screenshots are evidence, not automatic visual acceptance or physical Samsung verification.
