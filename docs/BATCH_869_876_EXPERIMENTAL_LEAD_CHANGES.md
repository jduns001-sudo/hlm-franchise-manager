# Batch 869–876: experimental period-boundary lead changes

1. **869** Compose the validated synthetic game trend layer.
2. **870** Identify scoreboard leaders at each period boundary.
3. **871** Count changes between distinct non-tied leaders.
4. **872** Count transitions from a lead into a tie.
5. **873** Track cumulative lead changes across periods.
6. **874** Track whether each team trailed after a period.
7. **875** Label period-boundary comeback wins.
8. **876** Audit symmetric scores, determinism, roster blockers and no persistence.

**Limitations:** Lead changes are only evaluated at period boundaries; in-period swings are not captured. Synthetic game events do not affect causal scores or player behavior. Comeback labels are illustrative, not authoritative historical game facts. No official standings, Front Office, franchise saves or Phase 11 import changes.

Run `node hlm-experimental-lead-changes.test.js`. Merge only after dedicated CI and Foundation Tests both green.
