'use strict';
const assert = require('assert');
const { evaluateFrontOfficeRuntimeCompatibility } = require('./hlm-front-office-runtime-compatibility');

(() => {
  const good = evaluateFrontOfficeRuntimeCompatibility({
    readOnly: true,
    persistenceEnabled: false,
    sourceSchema: 7,
    audit: { readyForReadOnlyDiagnostics: true }
  });
  assert.strictEqual(good.compatible, true);
  assert.strictEqual(good.reasons.length, 0);

  const badSchema = evaluateFrontOfficeRuntimeCompatibility({
    readOnly: true,
    persistenceEnabled: false,
    sourceSchema: 8,
    audit: { readyForReadOnlyDiagnostics: true }
  });
  assert.strictEqual(badSchema.compatible, false);
  assert(badSchema.reasons.some(x => /Unsupported/.test(x)));

  const badAudit = evaluateFrontOfficeRuntimeCompatibility({
    readOnly: true,
    persistenceEnabled: false,
    sourceSchema: 7,
    audit: { readyForReadOnlyDiagnostics: false }
  });
  assert.strictEqual(badAudit.compatible, false);

  const unsafe = evaluateFrontOfficeRuntimeCompatibility({
    readOnly: false,
    persistenceEnabled: true,
    sourceSchema: 7,
    audit: { readyForReadOnlyDiagnostics: true }
  });
  assert.strictEqual(unsafe.compatible, false);

  assert.strictEqual(evaluateFrontOfficeRuntimeCompatibility(null).compatible, false);
  console.log('Front Office runtime compatibility gate tests passed.');
})();
