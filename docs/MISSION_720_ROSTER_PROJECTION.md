# Mission 720: Phase 10 team roster projection

Accelerated gameplay foundation: convert an existing GameState's canonical positive player/team IDs into a detached team-roster view using the existing Mission 662 identity bridge. This is the first narrowly scoped roster-facing integration artifact after the diagnostic series.

The output includes teams with their player IDs and minimal player attributes, unresolved player/team references, diagnostics, validation, and fixed false safety flags. Sentinels -1, 0, 100 and unknown positive organizations remain distinct and unresolved. No name/abbreviation matching, player creation, lineup authorization, gameplay simulation, score calculation, persistence, UI or browser-save changes.

This does **not** claim that players are game eligible or that the Phase 10 demo uses real rosters yet. A subsequent mission should define game lineup eligibility and only then integrate actual player ratings into game resolution.

Run `node hlm-phase10-team-roster-projection.test.js`.
