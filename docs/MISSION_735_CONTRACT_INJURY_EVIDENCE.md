# Mission 735: Contract and injury eligibility evidence

Read-only evidence assessment of explicit GameState contract and injury records for players on known teams. It consumes Mission 721 candidate assessment and does not modify roster assignments or game state.

An active/signed contract for the correct team is evidence only, not a final eligibility certification. Multiple active/signed records or an active/signed contract for a different team are conflicting. Missing contracts are unverified, never assumed valid or invalid. Explicit active injuries are flagged; recovered injuries provide only a `no-active-injury-recorded` observation. Unknown injury statuses and absent injury records remain unverified. Excluded baseline candidates retain an explicit blocker.

Return flags `eligibilityCertified`, `lineupAuthorized`, `simulationAuthorized`, `sourceStateMutated` and `persistencePerformed` are always false. No injury recovery inference, medical clearance, lineup decision, game resolution, UI changes, Phase 10 demo changes or browser persistence.

Run `node hlm-phase10-contract-injury-evidence.test.js`.
