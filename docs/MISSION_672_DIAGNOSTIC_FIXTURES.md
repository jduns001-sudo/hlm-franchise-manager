# Mission 672: Fictional diagnostic fixtures

`hlm-franchise-diagnostic-fixtures.js` exports `DIAGNOSTIC_FIXTURE_NAMES` and `createDiagnosticFixture(name)`. Each call returns fresh `{ universe, roster }` objects. Unknown fixture names throw `UNKNOWN_DIAGNOSTIC_FIXTURE`.

| Name | Scenario |
| --- | --- |
| `clean` | Two fictional organizations with one player each; canonical data valid, game readiness still undefined |
| `invalidIdentities` | Duplicate Universe player ID, invalid zero player ID, and historical roster record missing Universe identity |
| `unresolvedOrganizations` | Known team, unknown positive organization, and distinct `-1`, `0`, `100` sentinel assignments |
| `mixedRoster` | Active candidates, retired player, unresolved organizations, and duplicate historical roster snapshots |

Fixtures are test-only synthetic records. They do not establish real league rules, roster sufficiency, free-agent eligibility, or permission to simulate. They never read or modify browser storage or source Universe JSON.

## Tests
`node hlm-franchise-diagnostic-fixtures.test.js` checks fixture isolation, existing Mission 668/669/670 output parity, diagnostic preservation, expected candidate and unresolved counts, and nonauthorization. GitHub Actions runs this suite with the existing foundational tests.

No Front Office, Phase 10 demo, browser saves, or production gameplay wiring changes.
