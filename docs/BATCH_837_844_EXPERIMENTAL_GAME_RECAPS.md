# Batch 837–844: experimental game recaps

1. **837** Consume read-only synthetic penalty-clock timelines.
2. **838** Build regulation/overtime period recap records.
3. **839** Aggregate period goals.
4. **840** Aggregate period shots.
5. **841** Aggregate inherited synthetic power-play goals.
6. **842** Calculate fractional period expected goals.
7. **843** Reconcile game-level score, shots, goalie saves and special-teams totals.
8. **844** Test determinism, missing-roster blockers and no-write isolation.

**Limitations:** This is a research-only recap of previously sampled scores and synthetic event labels, not actual NHL play-by-play. Expected goals are illustrative, penalties are hypothetical, and events do not causally determine the final score. No official stats, standings, Front Office, saves or Phase 11 import are modified.

Run `node hlm-experimental-game-recaps.test.js`. Merge only after dedicated CI and Foundation Tests green.
