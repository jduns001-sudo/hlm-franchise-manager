# Mission 739: Guarded roster-backed preview

Compose Mission 737 roster matchup evidence and Mission 723 deterministic roster score preview into a read-only preview gate. A projected score is produced only when both teams have complete six-slot proposals. Explicit blockers identify missing slots, unverified contract/injury evidence and the still-uncertified official game rules.

**Always blocked for official simulation:** `OFFICIAL_ELIGIBILITY_NOT_CERTIFIED` is unconditional. Even fully documented lineups are not league-certified, and projected scores cannot be saved as official games. The result flags `resultOfficial`, `eligibilityCertified`, `lineupAuthorized`, `simulationAuthorized`, `sourceStateMutated`, and `persistencePerformed` remain false.

No changes to existing game engines, Front Office, Phase 10 demo, save keys, browser persistence or gameplay. Next work must establish trusted official eligibility rules before writing game results.

Run `node hlm-phase10-roster-game-preview-gate.test.js`.
