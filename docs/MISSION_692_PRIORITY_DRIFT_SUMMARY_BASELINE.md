# Mission 692: Pinned priority drift summary baseline v1

This mission defines an **independent, immutable version 1 baseline** for the five fictional Mission 691 regression scenarios. Expected values are authored literally, without importing the runtime fixture generator into the baseline module.

| Scenario | Findings | Highest | Critical | High | Medium | Low | Categories | Priority fields |
|---|---:|---|---:|---:|---:|---:|---:|---|
| clean | 0 | none | 0 | 0 | 0 | 0 | none | none |
| safetyViolation | 1 | critical | 1 | 0 | 0 | 0 | safety-invariant | simulationAuthorized |
| diagnosticRegression | 3 | high | 0 | 3 | 0 | 0 | diagnostic-regression | highestSeverity, severityCounts.high, priorityFields |
| orderingChange | 1 | medium | 0 | 0 | 1 | 0 | ordering-or-count | scenarioNames |
| mixedPriority | 6 | critical | 1 | 3 | 1 | 1 | safety-invariant, diagnostic-regression, ordering-or-count, metadata-or-other | simulationAuthorized |

Scenario order is `clean`, `safetyViolation`, `diagnosticRegression`, `orderingChange`, `mixedPriority`. The baseline pins `hasDrift`, counts, severity, category order, priority fields, and disabled safety flags. The arrays and nested objects are frozen.

Run `node hlm-diagnostic-triage-priority-drift-summary-baseline-v1.test.js`. CI executes this test and previous diagnostic suites. This is read-only; no Front Office, Phase 10 demo, browser saves, live franchise records, or gameplay changes.
