'use strict';
const assert = require('assert');
const { createDiagnosticHost, validateDiagnosticHost } = require('./hlm-front-office-diagnostic-host');

(async () => {
  const source = { schema: 7, settings: { controlledTeamId: 5 }, contracts: [] };
  const host = createDiagnosticHost(async () => source);

  assert.strictEqual(host.readOnly, true);
  assert(Object.isFrozen(host));
  assert.strictEqual(validateDiagnosticHost(host).valid, true);

  const snapshot = await host.readState();
  snapshot.settings.controlledTeamId = 99;
  assert.strictEqual(source.settings.controlledTeamId, 5);

  assert.strictEqual(validateDiagnosticHost({ readState: async()=>({}), writeState:()=>{} }).valid, false);
  assert.strictEqual(validateDiagnosticHost({ readState: async()=>({}), db:{} }).valid, false);
  assert.throws(() => createDiagnosticHost(null), /readState/);

  const bad = createDiagnosticHost(async () => null);
  await assert.rejects(() => bad.readState(), e => e && e.code === 'INVALID_FRONT_OFFICE_SNAPSHOT');

  console.log('Front Office diagnostic host contract tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
