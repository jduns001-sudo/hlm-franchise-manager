# Phase 2 Mission 21 — Isolated Browser Persistence Integration

This mission connects the proven atomic persistence executor to the existing Web Storage adapter while preserving the legacy Front Office namespace.

New GameState saves use `hfm_game_state_saves_v1`. The legacy `hlm_tracker_v3` value is captured before the isolated write and checked afterward. The integration never intentionally writes or deletes the legacy key.

This module is browser-capable but is not yet loaded or called by `app.html`. Therefore GitHub Pages behavior remains unchanged. The next controlled mission may add an explicit, opt-in Front Office migration action only after automated browser-storage tests remain green.
