# Phase 11 Mission #1125: Experimental Shot Quality

Status: initial planning commit; implementation and CI not yet completed.

## Goal
Introduce deterministic shot-quality estimates for existing simulated shot events, without treating shots as goals or changing official game results.

## Controlled implementation
- Derive transparent shot-quality estimates from existing position-aware shot events and seeded inputs.
- Validate probability bounds, repeatability, valid on-ice shooters, and per-player aggregation.
- Keep the model in experimental read-only browser/Node surfaces.
- Add statistical and mobile Chromium regressions before requesting merge.

## Safety gates
No production-save writes, no automatic game-state application, no official scoring changes, no live Front Office activation. Human GM retains final decision authority. Merge only after all required final-head CI passes.
