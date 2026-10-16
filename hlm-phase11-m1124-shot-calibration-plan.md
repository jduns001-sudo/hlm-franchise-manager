# Phase 11 Mission #1124: Shot-event calibration and validation

Status: experimental planning baseline, not production activation.

## Scope
- Compare deterministic per-period shot distributions across many seeds and lineup configurations.
- Test forward versus defense shot share, player overall sensitivity, shortened shifts and short periods.
- Verify all generated shooters are on ice and events remain time ordered.
- Expand mobile Chromium assertions for alternate seeds, roster inputs and repeatability.
- Ensure preview never writes to production saves, never auto-applies results, and requires human GM approval.

## Release gates
- Dedicated Node and Chromium CI plus foundation and persistent-season workflows must pass at the final head.
- No changes to production game saves, live Front Office activation or GM decision authority.
- PR remains draft until implementation and regression evidence are reviewed.
