# Mission 678: Diagnostic triage contract tests

This mission adds **tests only** to independently verify the Mission 677 read-only triage summary contract. No production code is modified.

The contract tests use explicit synthetic classified findings, independent of the normal diagnostic fixture pipeline, and verify:

- Mixed critical/high/medium/low findings and exact severity counts.
- Deterministic category ordering by highest severity, alphabetical tie-breaking, and stable within-category ordering for equal severities.
- Priority findings at the highest observed severity, with stable original order.
- Category totals, overall totals, category-specific counts and highest-severity consistency.
- Read-only input isolation and detached nested expected/actual arrays.
- Clean baseline, no-critical case, invalid report/finding rejection.
- Safety flags always remain false; no gameplay authorization, source mutation or persistence.

Run `node hlm-diagnostic-triage-contract.test.js`. CI also runs the Mission 677 tests and prior franchise diagnostic foundation suites.

The Front Office, Phase 10 demo, browser saves, game logic, and franchise data remain unchanged.
