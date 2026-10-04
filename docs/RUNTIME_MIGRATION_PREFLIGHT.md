# Phase 2 Mission 26 — Runtime Migration Preflight

This read-only preflight inspects supplied Web Storage before any live migration is allowed.

It checks for the legacy source, parses it without mutation, builds and validates the existing atomic persistence plan, and warns when the new GameState namespace already exists. It performs no save, delete, migration, or app.html integration.

A warning about an existing new-save namespace does not silently overwrite anything. The later caller must choose an explicit slot/replace policy.

This mission preserves the runtime audit rule: do not modify initDB/openStateDB until their exact implementation is inspectable.
