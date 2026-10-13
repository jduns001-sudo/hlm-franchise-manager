# Batch 805–812: controlled experimental shot-quality lab

Eight related research milestones:

1. **805** Consume the validated synthetic shot timeline without modifying it.
2. **806** Assign deterministic illustrative shot locations.
3. **807** Annotate shots with bounded shooter-rating quality.
4. **808** Adjust hypothetical quality for opposing goalie overall.
5. **809** Aggregate fractional team expected goals.
6. **810** Reconcile goalie shots, saves and expected goals against.
7. **811** Explicitly identify even-strength-only fixtures; report power-play and penalty-kill counters as zero rather than invent penalties or special-teams situations.
8. **812** Audit cross-level totals, repeatability, incomplete evidence, and read-only isolation.

**Important:** Shot quality is fictional and not NHL-calibrated. Goals are inherited from pre-sampled scores and are never derived from these probabilities. No penalty generation, power plays, penalty killing, rebounds, actual goalie fatigue, or authentic play-by-play is implemented. Special teams remain a future gated experiment. No official results, save writes, standings, Front Office or Phase 11 import changes.

Run `node hlm-experimental-shot-quality.test.js`. Both this dedicated CI and Foundation Tests must be green before merge.
