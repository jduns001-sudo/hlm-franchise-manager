# Batch 829–836: experimental minor penalty clocks

1. **829** Compose validated research-only manpower event timelines.
2. **830** Assign stable hypothetical minor penalty identifiers.
3. **831** Track scheduled expiration timestamps.
4. **832** Detect first inherited power-play goal within a minor penalty window.
5. **833** End synthetic minor penalties on a qualifying goal.
6. **834** Recalculate subsequent shot-strength labels and 5-on-4 manpower.
7. **835** Reconcile even-strength, short-handed, power-play shots and goals.
8. **836** Test determinism, inherited-score preservation, incomplete roster blockers and no persistence.

**Limitations:** This is retrospective labeling of a previously sampled score, not a causal penalty/game engine. Penalty windows are invented, no player takes a penalty, no overlapping penalties or double minors, and penalties do not affect the probability of goals. A goal at the penalty-expiration second is attributed to the power play when it causes the expiry. No official stats, standings, saves, Front Office or Phase 11 import change.

Run `node hlm-experimental-penalty-clocks.test.js`. Merge only after dedicated CI and Foundation Tests both green.
