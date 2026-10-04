# Phase 2 Mission 28: Front Office Runtime Adapter Boundary

## Purpose

Define the smallest safe seam between the existing Front Office runtime and the Phase 2 GameState work.

The existing Front Office remains the operational source while Phase 2 is introduced. This mission therefore adds a **read-only adapter contract**. It does not modify the live application.

## Boundary

The host runtime supplies one function: `readLegacyState()`.

The adapter:

- reads the current Front Office state through that injected function;
- validates that a state object was returned;
- returns a detached JSON snapshot so Phase 2 code cannot mutate the live object by reference;
- exposes a small inspection report for counts and controlled-team identity;
- accepts no write callback.

## Safety

This mission does not edit `app.html`, `initDB()`, `openStateDB()`, IndexedDB schema, service worker behavior, or existing save behavior.

The next live integration must connect this adapter only to the existing read path first. No new-engine write should be enabled in that same step. Physical Front Office regression testing is required after that future runtime edit.
