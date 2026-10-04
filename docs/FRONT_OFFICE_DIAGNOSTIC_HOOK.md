# Phase 2 Mission 30: Live Read Hook Contract

## Purpose

Define the exact host-facing contract for the first future connection to the existing Front Office.

The live application will eventually supply its existing, proven `readState` function. The hook runs the Phase 2 read-only preflight and returns diagnostics.

## Deliberate restrictions

The hook accepts no:

- `writeState` function;
- IndexedDB database handle;
- localStorage object;
- save repository;
- migration execution callback.

The returned report is marked `diagnosticOnly: true` and `persistenceEnabled: false`.

Concurrent diagnostic runs are rejected to keep the first integration deterministic.

## Integration rule

This mission still does not edit `app.html`. The first `app.html` change should do only three things:

1. expose the existing `readState` path to this diagnostic boundary;
2. provide a small explicit diagnostic trigger, not an automatic startup action;
3. display/report the result without altering franchise state.

After that runtime edit deploys, physical Front Office regression testing is mandatory before any write-capable Phase 2 control is considered.
