# Mission 736: Read-only game eligibility evidence

Combines Mission 722 proposed lineup slots and Mission 735 contract/injury evidence using permanent player/team IDs. Each slot is `missing`, `blocked-or-unverified` or `evidence-complete`. Contract conflicts, active injuries, missing contracts, absent injury clearance and missing positions remain explicit blockers.

**Evidence-complete is not certified game eligibility.** `gameEligible` remains null for every team. League rules, medical clearance, cap constraints, and roster registration have not been established. All authorization and persistence flags remain false. No simulation, scores, UI, demo, save or source-state changes.

Tests cover a mixed six-slot lineup, missing team positions, conflict/injury/unknown blockers, repeatability, detachment and invalid GameState.

Run `node hlm-phase10-game-eligibility-evidence.test.js`.
