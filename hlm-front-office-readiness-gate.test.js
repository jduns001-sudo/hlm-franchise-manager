'use strict';
const assert = require('assert');
const { evaluateReadOnlyRuntimeReadiness } = require('./hlm-front-office-readiness-gate');

(() => {
  const ready = evaluateReadOnlyRuntimeReadiness({
    readOnly: true, persistenceEnabled: false, compatible: true,
    sourceSchema: 7, warningCount: 1, blockerCount: 0
  });
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.warningCount, 1);

  const unsafe = evaluateReadOnlyRuntimeReadiness({
    readOnly: false, persistenceEnabled: true, compatible: false,
    sourceSchema: 8, blockerCount: 2
  });
  assert.strictEqual(unsafe.ready, false);
  assert(unsafe.blockers.length >= 4);

  const auditBlocked = evaluateReadOnlyRuntimeReadiness({
    readOnly: true, persistenceEnabled: false, compatible: true,
    sourceSchema: 7, blockerCount: 1
  });
  assert.strictEqual(auditBlocked.ready, false);

  assert.strictEqual(evaluateReadOnlyRuntimeReadiness(null).ready, false);
  console.log('Front Office read-only readiness gate tests passed.');
})();
