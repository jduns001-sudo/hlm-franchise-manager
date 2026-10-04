# Phase 2 Mission 22 — Migration Command Boundary

Legacy Front Office migration is represented as an explicit command, `MIGRATE_LEGACY_FRONT_OFFICE`.

The command refuses to execute unless its caller supplies `confirmed:true`. With confirmation it reads the legacy source, builds the proven backup-first atomic persistence plan, and writes only through the isolated browser GameState adapter. The legacy source remains preserved.

This is the first command boundary for a state-changing migration operation. It is still not wired to `app.html` or any UI control, so the live Front Office cannot invoke it yet.
