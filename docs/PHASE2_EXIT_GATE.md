# Phase 2 Exit Gate

Phase 2 is **Central GameState and save/load**. Phase 3 is **Calendar and season engine**.

## Automated evidence

The Foundation Tests chain covers:
- Central GameState envelope and structural validation
- deterministic serialization and round-trip
- save envelope integrity/tamper detection
- save repository and browser persistence
- backup/export/import transfer
- legacy migration validation and permanent-ID migration
- atomic persistence and rollback/recovery boundaries
- isolated GameState activation and exact candidate verification
- Front Office projection, compatibility, cutover dry run, readiness
- controlled deployed legacy-default read integration

Passing CI is necessary but is not by itself sufficient to close Phase 2.

## Required physical regression checklist

Before Phase 2 can be signed off on the deployed GitHub Pages Front Office, verify:

- [ ] Existing Front Office loads
- [ ] Team selection works
- [ ] Roster works
- [ ] Lines work
- [ ] Player information is correct
- [ ] Contracts work
- [ ] Draft picks are correct
- [ ] Prospects work
- [ ] No console errors
- [ ] Save succeeds
- [ ] Reload succeeds
- [ ] State remains unchanged after reload
- [ ] No unrelated screens were broken
- [ ] GitHub Pages build remains functional

## Exit rule

Phase 3 must not begin until both the automated Foundation Tests and all relevant physical regression checks pass.

The deployed Front Office remains legacy-default at the end of Mission 87. The Phase 2 architecture provides the Central GameState/save foundation and guarded integration boundaries; it does not authorize silent source switching, legacy deletion, or simulation/calendar advancement.
