# Mission 710: Independent pinned priority summary baseline

Mission 710 establishes an **independently authored, deeply frozen v1 expected baseline** for the five fictional Mission 709 scenarios. The baseline module does not import or execute the fixture generator or any report builder, so it cannot silently regenerate expectations from the implementation being tested.

Export: `PRIORITY_SUMMARY_PRIORITY_EXPECTED_BASELINE_V1`.

The baseline pins kind, version, matrixVersion, scenario order, per-scenario drift flags, finding counts, highest severity, all four severity counts, category counts, category order, highest-priority fields, urgent fields and simulation authorization. Top-level safety flags are explicitly false.

Expected severity counts (critical, high, medium, low):
- clean: 0, 0, 0, 0
- safetyViolation: 1, 0, 0, 0
- diagnosticRegression: 0, 3, 0, 0
- orderingChange: 0, 0, 2, 0
- mixedPriority: 1, 3, 2, 1

All nested arrays and objects are frozen. Tests compare independent literal expectations with the baseline and the Mission 709 fixture matrix, recursively verify immutability, reject attempted mutation, and confirm fixture mutation cannot alter pinned expectations.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-baseline-v1.test.js`.

This mission is diagnostic and read-only. No gameplay, simulation authorization, persistence, Front Office, Phase 10 demo, browser saves or live franchise data are changed.
