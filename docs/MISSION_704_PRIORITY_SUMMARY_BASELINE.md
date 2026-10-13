# Mission 704: Independently pinned priority summary baseline v1

This mission pins the expected outputs for all five fictional Mission 703 priority summary scenarios. The baseline module **does not import or execute** any fixture generator, diagnostic report, simulation module or persistence API. Expected values are authored as constants and deeply frozen.

`PRIORITY_SUMMARY_EXPECTED_BASELINE_V1` includes the baseline kind and version, fixture matrix version, ordered scenario names, per-scenario drift state, exact finding counts, highest severity, severity counts, category count and order, priority and urgent fields, and advisory-only safety flags.

The contract test compares these independent constants to the Mission 703 fixture matrix, verifies every nested object and array is frozen, tests attempted mutations and isolation, and asserts false simulation/persistence flags.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-baseline-v1.test.js`. CI also runs prior diagnostic suites. The pinned baseline is intended for a later drift comparison mission; it does not authorize simulation or alter Front Office, Phase 10 demo, browser saves, live franchise state or gameplay.
