# Phase 2 Mission 13 — Deferred Legacy Field Preservation Policy

Legacy fields without a final first-class GameState home must not be discarded merely to make migration possible.

This mission defines a conservative preservation policy for `awards`, `draftClasses`, `gmSettings`, `snapshot`, and `franchiseName`.

Their complete legacy values are cloned under `extensions.legacy.preserved`. This is an explicit compatibility holding area, not their final domain model. A legacy `gmSettings.controlledTeamId` may additionally seed `meta.controlledTeamId` only when the GameState value is unset.

The source legacy object and input GameState are not mutated. No browser persistence occurs.

This policy removes the risk of silently losing these fields while allowing their eventual first-class models to be designed independently.
