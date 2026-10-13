# Batch 893–900: experimental highlight verification

1. **893** Consume validated synthetic game highlights.
2. **894** Index period snapshots for traceability.
3. **895** Verify each shot-summary highlight against period shots.
4. **896** Verify score-leader highlights against period scorelines.
5. **897** Verify close-score highlights against period margins.
6. **898** Verify cumulative lead-history labels against period records.
7. **899** Add stable highlight ordinal IDs and type counts.
8. **900** Audit all highlight references, final scores, determinism, roster blockers and no persistence.

**Limitations:** This audits internal consistency of synthetic summaries, not real match events or NHL-calibrated outcomes. It does not make simulation more causal or introduce official statistics. No Front Office, franchise saves, standings or Phase 11 import changes.

Run `node hlm-experimental-highlight-audit.test.js`. Merge only after dedicated CI and Foundation Tests both green.
