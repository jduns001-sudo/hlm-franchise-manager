# Phase 2 Mission 31: Browser Diagnostic Bundle

## Purpose

Provide a build-free browser-compatible diagnostic module for the static GitHub Pages Front Office.

The Phase 2 foundation modules are CommonJS and are tested in Node. The live Front Office is a static HTML application, so loading those CommonJS modules directly in the browser would fail. This mission adds a deliberately tiny browser boundary instead of introducing a bundler or rewriting the application.

## API

The script exposes `window.HFMPhase2Diagnostic` with:

- `createDiagnosticHook(readState)`
- `summarize(snapshot)`

The hook accepts only the existing read function. It clones the returned state before inspection and reports counts, schema, controlled-team identity, and explicit safety flags.

## Safety

The browser module contains no IndexedDB calls, no localStorage calls, no write callback, no migration execution, and no automatic startup behavior.

This mission does not edit `app.html` or the service worker. A future mission may load this script and expose a manual diagnostic trigger. That first live edit must then receive physical Front Office regression testing before Phase 2 gains any write capability.
