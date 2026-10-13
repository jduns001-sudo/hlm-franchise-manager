# Mission 752: Experimental seeded score distribution

Planning only until Mission 751 passes both required CI checks and merges.

## Scope

- Branch from updated main and consume Mission 751's isolated seeded dry-run API.
- Generate a bounded batch of reproducible hypothetical score samples from explicit seed and sample count.
- Enforce positive integer sample count and a strict maximum to prevent runaway work.
- Refuse incomplete research evidence, returning blockers and no samples.
- Report descriptive sample statistics only, not official results, wins, standings or game predictions.
- Test same-seed reproducibility, varied seeds, invalid bounds, blocked evidence, no mutation or persistence.
- Add dedicated CI and require Foundation CI green before merge.

Front Office, franchise saves and Phase 11 import remain unchanged.
