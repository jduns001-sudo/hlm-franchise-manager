# Batch 861–868: experimental game trends

1. **861** Consume the validated synthetic game momentum layer.
2. **862** Reconstruct each period's goal swings.
3. **863** Reconstruct each period's shot swings.
4. **864** Track cumulative score margin.
5. **865** Track cumulative shot margin.
6. **866** Identify close-score periods and shot intensity.
7. **867** Aggregate periods outshooting and outscoring the opponent.
8. **868** Audit symmetric team margins, determinism, roster blockers and no-write safety.

**Limitations:** All trends describe already sampled synthetic scores and shots. They are not causal simulation inputs or authoritative NHL statistics. No game outcomes, official records, standings, Front Office, franchise saves or Phase 11 import are modified.

Run `node hlm-experimental-game-trends.test.js`. Merge only after dedicated CI and Foundation Tests both green.
