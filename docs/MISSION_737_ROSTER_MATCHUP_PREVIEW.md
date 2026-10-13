# Mission 737: Roster-backed matchup preview

This read-only Phase 10 bridge joins Mission 722 lineup proposals with Mission 736 game eligibility evidence for two explicitly selected permanent team IDs. It reports selected player IDs, proposed rating totals and counts, missing slots, and per-slot contract/injury evidence and blockers. It preserves unknown/unverified status.

**No games are simulated.** Ratings are descriptive, not probabilities or predicted scores. Even when all six proposed slots have evidence, game eligibility remains unknown because league rules, roster registration, cap and medical clearance are not certified. `scorePredicted`, `eligibilityCertified`, `lineupAuthorized`, `simulationAuthorized`, `sourceStateMutated` and `persistencePerformed` are always false.

Invalid IDs and unknown teams are rejected with stable codes. Tests cover a full versus incomplete lineup, evidence counts, deterministic output, source isolation, invalid team IDs and invalid GameState. No changes to Front Office, Phase 10 demo, browser saves, or gameplay.

Run `node hlm-phase10-roster-matchup-preview.test.js`.
