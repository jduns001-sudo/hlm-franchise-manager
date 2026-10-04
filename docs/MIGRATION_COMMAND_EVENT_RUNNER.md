# Phase 2 Mission 24 — Command/Event Runner

This mission composes the migration command and migration event boundaries into one deterministic runner.

Successful or blocked commands return their structured result plus requested/completed or requested/blocked events. Thrown migration failures are converted into a failed event while the original error remains available to the caller.

The runner does not own storage, UI, or GameState. It coordinates existing boundaries only. It is not loaded by app.html.
