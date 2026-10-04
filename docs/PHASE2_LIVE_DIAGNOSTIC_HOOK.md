# Phase 2 Mission 32: Live Diagnostic Hook

Mission 32 captures the browser-facing seam between the existing Front Office and the Phase 2 diagnostic bundle.

## Scope

`hlm-front-office-live-diagnostic.js` exposes `HFMFrontOfficeDiagnostic.install(readState)`. The host supplies its existing proven read-only state reader. Installation exposes `frontOfficeDiagnostic.run()`, which delegates to the Mission 31 browser diagnostic bundle.

The bridge is deliberately diagnostic-only:

- it accepts a read function only;
- it exposes no write function, IndexedDB handle, localStorage handle, or persistence callback;
- reports remain marked `readOnly`, `diagnosticOnly`, and `persistenceEnabled: false`;
- it does not run automatically at startup;
- it does not modify `app.html`, `initDB`, `openStateDB`, `writeState`, or the service worker.

## Runtime regression evidence

The Front Office was manually exercised on Android after the diagnostic work. It loaded, navigation remained available, the Controlled Team screen opened, Pittsburgh could be selected, and the selected team was reported correctly. This is regression evidence for the read-only diagnostic seam, not authorization for Phase 2 persistence.

## Next boundary

The next mission may define a safe, explicit host wiring point for this bridge. It must remain read-only. New-engine writes and migration execution remain out of scope until a separate reviewed mission.
