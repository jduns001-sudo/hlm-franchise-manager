# Mission 665: Classified canonical player bridge

## Change
The existing `createCanonicalFranchiseBridgeSnapshot(universe, roster, options)` now attaches an informational `organizationReference` object to each resolved player. It uses the Mission 664 `createOrganizationReferenceClassifier` with the canonical team list from the in-memory GameState envelope.

The classification is applied **after** the canonical resolver has applied player fixes and explicit overrides. Each player's `teamId`, `teamResolved`, `overall`, `position`, team membership, and historical roster provenance remain governed by Missions 662 and 663.

## Output
Each player gains `organizationReference: {status, teamId, confidence, eligibleFreeAgent?}`. The snapshot also exposes `organizationDiagnostics` for invalid or duplicate team table IDs.

Classification statuses: `known-team`, `external-organization-unresolved`, `sentinel-no-team` (-1), `sentinel-unassigned` (0), `sentinel-legacy-unknown` (100), `other-negative-sentinel`, and `invalid-reference`.

The original bridge `validation` and `diagnostics` are intentionally unchanged. An unresolved organization remains a reported issue until a later mission defines informational versus blocking diagnostics. No free-agent eligibility, roster status, or organization identity is inferred.

## Boundaries
No changes to the Front Office, Phase 10 demo, browser storage, save keys, source Universe/roster JSON, or simulation logic. The adapter remains disconnected from the live UI.

## Tests
`node hlm-classified-canonical-bridge.test.js` checks resolver precedence, known teams, all sentinel classes, external and invalid references, historical duplicates, validation preservation, and nonmutation.
