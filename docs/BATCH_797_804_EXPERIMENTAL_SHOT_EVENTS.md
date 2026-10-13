# Accelerated batch 797–804: hypothetical shot-event timeline

Eight related research-only gameplay milestones:

1. **797:** Period-specific clock durations for fictional shot events.
2. **798:** Deterministic, ordered shot-event generation by period and team.
3. **799:** Overall-weighted shooter attribution for each attempt.
4. **800:** Explicit goal events reconciled to sampled period goals.
5. **801:** Goal-level first/second assist attribution without duplicate players.
6. **802:** Reconstructed skater shots, goals, assists and points from event records.
7. **803:** Goalie shots against, saves and save percentage from opposing shot events.
8. **804:** Cross-check event, period, team, skater and goalie totals, determinism, blocked fixtures and no-write safety.

**Limitations:** The event timeline is a synthetic reconstruction of pre-sampled scores, not possession-based hockey. Goal attempts are allocated first in each period's generated shot sequence, not via calibrated shooting probabilities. There is no actual puck movement, faceoffs, penalties, fatigue, defensive matchups, authentic overtime length, or calibrated shot quality. The pre-existing experimental box score is not overwritten; this module independently reconstructs its own internally consistent event statistics.

No official game results, saved stats, standings, Front Office, roster import or Phase 11 PR #764 changes. Dedicated CI and Foundation Tests must pass before merge.
