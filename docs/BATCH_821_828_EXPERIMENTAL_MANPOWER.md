# Batch 821–828: synthetic manpower audit

1. **821** Compose the experimental special-teams research fixture.
2. **822** Derive bounded 5-on-5 or 5-on-4 manpower windows.
3. **823** Identify the penalized team during each fixed window.
4. **824** Classify shot events by manpower advantage.
5. **825** Track even-strength shot totals.
6. **826** Track short-handed shot totals.
7. **827** Reconcile power-play shots and goals with the prior experimental layer.
8. **828** Test determinism, game-score preservation, roster blockers, and no-write safety.

**Limitations:** Manpower counts are synthetic annotations, not actual players on the ice. Penalty clocks do not expire after a power-play goal, and there is no penalty stacking, delayed penalty, penalty shot, overtime manpower rule, player shift, possession or actual game state mutation. The upstream score remains unchanged. No official stats, standings, Front Office, saves or Phase 11 import are changed.

Run `node hlm-experimental-manpower.test.js`. Merge only after dedicated CI and Foundation Tests both green.
