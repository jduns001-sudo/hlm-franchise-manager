# Batch 845–852: read-only experimental game recap analytics

1. **845** Consume the validated synthetic period/game recap.
2. **846** Calculate period shot shares with zero-shot guards.
3. **847** Calculate period goal differential for both teams.
4. **848** Calculate game goal and shot differential.
5. **849** Calculate bounded team shooting percentages.
6. **850** Calculate goalie save percentages from reconstructed shots against.
7. **851** Calculate illustrative PDO and goals above expected.
8. **852** Audit symmetric team totals, deterministic results, roster blockers and no-write safety.

**Limitations:** The source events are synthetic reconstructions of previously sampled scores. PDO and expected goals are illustrative and not calibrated or suitable for predicting NHL outcomes. No causal possession simulation, real play-by-play, player shifts or authoritative stats are produced. No Front Office, official scores, standings, saves or Phase 11 roster import changes.

Run `node hlm-experimental-recap-analysis.test.js`. Dedicated CI and Foundation Tests must both be green before merge.
