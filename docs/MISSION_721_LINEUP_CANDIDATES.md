# Mission 721: Phase 10 lineup candidate assessment

Read-only, deterministic assessment over the Mission 720 roster projection. A player is a **candidate** only when assigned to a resolved team, not retired, with position C/LW/RW/D/G and integer overall 0–99. Other players are excluded with explicit reasons RETIRED, POSITION_UNKNOWN or OVERALL_INVALID. Unresolved organization IDs and sentinels -1, 0 and 100 remain separate.

A candidate is **not** confirmed game eligible. Contracts, injuries, roster limits, active lineup construction, goaltender availability, and league rules are not yet enforced. All team lineupReady values are null; lineupAuthorized, simulationAuthorized, sourceStateMutated and persistencePerformed are false.

Tests check candidates and exclusions, deterministic ordering, unchanged input, detached arrays, unresolved identities, and invalid GameState.

Run `node hlm-phase10-lineup-candidate-assessment.test.js`. No UI, browser saves, score simulation, contracts or gameplay modifications.
