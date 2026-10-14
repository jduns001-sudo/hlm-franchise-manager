# Phase 11 roster activation readiness

## Current deployment decision: NO-GO for production activation

Production activation remains disabled by default. The mobile workbench exposes read-only safety checks, not an activation button. No code in this batch automatically modifies a user's live franchise save.

## Verified acceptance coverage

- Browser-based real `app.html` controlled-team roster display after imported `customPlayers` schema 7 save and reload.
- Opt-in test-only atomic cutover requiring exact GM approval phrase.
- Reopened downloaded backup provenance, SHA-256 and active-save equality.
- Full production universe and existing custom-player ID collision checks.
- Repeat preflight and complete candidate comparison immediately before commit.
- One IndexedDB readwrite transaction for candidate save and recovery journal.
- Concurrent-save rejection; journal verification; exact authorized rollback; refusal to overwrite later GM edits.
- Mobile workbench defaults to read-only preview with production activation hard-disabled.

## Unfinished production requirements

1. Product-reviewed opt-in activation UI must be designed and gated independently from the read-only workbench. Do not enable it merely because tests pass.
2. Validate complete production `hlm-universe.json` with representative large imports and multiple team mappings, not only minimal synthetic Chromium fixtures.
3. Add cross-tab coordination and interrupted-transaction recovery UX; IndexedDB compare-and-swap protects atomic state but not user communication.
4. Confirm all imported player metadata and position/contract/line views render correctly in the actual Front Office.
5. Validate save export/restore, upgrade paths, backup recovery and mobile browser persistence on real devices.
6. Require explicit user confirmation and independent approval before shipping any enabled activation.

## Release policy

No automatic activation. No migration of user saves. Keep `enabledByDefault:false`, `productionEnabled:false`, and the workbench preview read-only until separate production acceptance and approval.
