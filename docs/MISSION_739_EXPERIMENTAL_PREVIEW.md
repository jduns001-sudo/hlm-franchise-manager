# Mission 739: Experimental roster rating preview

Mission 739 consumes Mission 738's detached roster-backed game input. It computes arithmetic mean overall for each six-player proposed unit, rating difference and the higher-rated team. These are **experimental comparisons only**, not goals, probabilities, winners, or legal game results.

When either unit has missing slots or unresolved contract/injury evidence, numeric outputs and favored team are null. No real franchise game is simulated. All simulation, score, result, persistence and eligibility flags remain false. Existing saves, Front Office and Phase 10 demo remain unchanged.

Run `node hlm-phase10-experimental-score-preview.test.js`. Next step: controlled fixture-only score modeling with explicit rules and validation before any real franchise integration.
