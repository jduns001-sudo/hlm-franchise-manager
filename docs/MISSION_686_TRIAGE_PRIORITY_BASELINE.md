# Mission 686: Independent diagnostic triage priority baseline v1

`PRIORITY_EXPECTED_BASELINE_V1` in `hlm-diagnostic-triage-priority-baseline-v1.js` is an independently authored, deeply frozen contract for the five fictional Mission 685 scenarios.

The baseline pins scenario names and order, drift flags, finding counts, highest severity, critical/high/medium/low counts, category totals and ordered category names, priority fields, and simulation authorization safety flags. Its expected values are **not generated from the Mission 685 matrix**; changing runtime output cannot silently rewrite expectations.

Automated tests compare a newly generated Mission 685 fixture matrix against the pinned baseline, verify every expected scenario independently, reject attempts to mutate frozen objects/arrays, and confirm matrix mutations do not change the baseline.

Run `node hlm-diagnostic-triage-priority-baseline-v1.test.js`. CI runs this alongside prior diagnostic suites.

This mission is read-only test infrastructure. It does not authorize simulation or persistence and does not change the Front Office, Phase 10 demo, browser saves, live franchise records, or gameplay.
