# Mission 716: Independent immutable priority summary baseline

Mission 716 establishes a manually authored, deeply frozen version-1 expected baseline for the five Mission 715 fictional scenarios. The baseline module **does not import or execute** the fixture matrix or report generator. The test suite independently compares its pinned values to the observed fixture matrix.

Exports `PRIORITY_SUMMARY_FINAL_EXPECTED_BASELINE_V1` with `kind`, `version: 1`, `matrixVersion: 1`, frozen ordered `scenarioNames`, frozen `expectations` keyed by scenario, and false safety flags. Each expectation pins `hasDrift`, `findingCount`, `highestSeverity`, four `severityCounts`, `categoryCount`, ordered `categoryNames`, ordered `priorityFields`, ordered `urgentFields`, and `simulationAuthorized: false`.

| Scenario | Critical | High | Medium | Low | Categories | Highest |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| clean | 0 | 0 | 0 | 0 | 0 | null |
| safetyViolation | 1 | 0 | 0 | 0 | 1 | critical |
| diagnosticRegression | 0 | 3 | 0 | 0 | 1 | high |
| orderingChange | 0 | 0 | 2 | 0 | 1 | medium |
| mixedPriority | 1 | 3 | 2 | 1 | 4 | critical |

Tests validate all exact expectations, scenario order, all nested object and array freeze states, mutation rejection, isolation from fixture outputs, and repeatability.

Run `node hlm-diagnostic-triage-priority-drift-summary-comparison-priority-summary-priority-priority-baseline-v1.test.js`.

This is an advisory-only regression reference. No Front Office, Phase 10 demo, browser saves, live franchise data, simulation or gameplay changes.
