# Accelerated batch 781–788: experimental hockey periods and overtime

Eight related research-only capabilities:

1. **781:** Seeded random source for reproducible hypothetical periods.
2. **782:** Distribute sampled regulation goals over three periods.
3. **783:** Produce period-by-period hypothetical scorelines.
4. **784:** Resolve tied regulation games with a hypothetical overtime winning goal.
5. **785:** Separate regular-season and playoff overtime labels; no playoff shootout.
6. **786:** Build period box scores and score-total reconciliation.
7. **787:** Validate three-period and overtime scoring invariants.
8. **788:** Run best-of-seven research playoff series using overtime resolution rather than shootouts.

**Realism limitations:** Overtime winner is seeded 50/50, not a full possession/shot/event simulation; all ties are decided in one hypothetical overtime period. No authentic NHL five-minute OT, multi-period playoff overtime, regular-season shootouts, player-level stats, or injuries yet. Existing older experimental playoff module remains unchanged. This is an isolated alternative lab, not a production gameplay integration.

No saves, Front Office, official standings, roster imports, storage writes, or Phase 11 PR #764 modifications. Dedicated CI and Foundation Tests required before merge.
