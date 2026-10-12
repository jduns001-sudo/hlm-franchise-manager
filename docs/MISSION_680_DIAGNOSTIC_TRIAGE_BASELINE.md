# Mission 680: Independent diagnostic triage baseline v1

`hlm-diagnostic-triage-baseline-v1.js` exports `TRIAGE_EXPECTED_BASELINE_V1`, a manually authored, frozen baseline for the six controlled fictional scenarios introduced in Mission 679. It is not generated from the live diagnostic matrix at runtime.

The baseline pins scenario order and each scenario's drift flag, drift count, highest severity, exact per-severity counts, ordered category names, and ordered highest-priority fields. It also pins the matrix version and the nonauthorization/nonmutation/nonpersistence safety flags.

`hlm-diagnostic-triage-baseline-v1.test.js` compares the fresh Mission 679 fixture matrix with the independent expected values and exercises negative controls for changed counts, severity, category ordering, priority fields, scenario order and safety flags.

Run `node hlm-diagnostic-triage-baseline-v1.test.js`. The GitHub Actions workflow also runs the previous diagnostic foundation tests.

This baseline is a regression contract, not permission to simulate. It never reads live franchise records or browser saves. No Front Office, Phase 10 demo, gameplay or production runtime changes are made.
