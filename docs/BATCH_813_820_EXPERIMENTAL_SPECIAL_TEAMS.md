# Batch 813–820: isolated synthetic special-teams annotations

1. **813** Consume read-only validated shot-quality events.
2. **814** Generate three deterministic hypothetical regulation minor-penalty windows.
3. **815** Assign a penalized team per period.
4. **816** Annotate shot events as even-strength, power-play or short-handed.
5. **817** Count hypothetical power-play opportunities and shots.
6. **818** Count power-play goals already present in sampled scores.
7. **819** Count penalty-kill opportunities, shots against and goals against.
8. **820** Audit inherited goals and shots, repeatability, incomplete evidence and no writes.

**Limitations:** This is retrospective synthetic labeling of existing sampled scores. Penalty windows do not alter scoring chances or terminate early after power-play goals. No real penalty assessments, manpower changes, actual officiating rules, special-teams lineups, player penalties or official results are created. A future simulator must model these causally. No Front Office, saves, Phase 11 import, standings or official stats change.

Run `node hlm-experimental-special-teams.test.js`. Merge only after dedicated CI and Foundation Tests both pass.
