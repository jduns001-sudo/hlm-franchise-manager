'use strict';
const assert=require('assert');
require('./hlm-phase2-browser-diagnostic.js');
(async()=>{
  assert(global.HFMPhase2Diagnostic);
  const source={schema:7,players:[{id:1}],teams:[{id:5}],contracts:[{}],transactions:[{},{}],draftPicks:[{}],settings:{controlledTeamId:5}};
  const hook=global.HFMPhase2Diagnostic.createDiagnosticHook(async()=>source);
  const report=await hook.run();
  assert.strictEqual(report.readable,true);
  assert.strictEqual(report.readOnly,true);
  assert.strictEqual(report.diagnosticOnly,true);
  assert.strictEqual(report.persistenceEnabled,false);
  assert.strictEqual(report.schema,7);
  assert.strictEqual(report.playerCount,1);
  assert.strictEqual(report.controlledTeamId,5);
  assert.throws(()=>global.HFMPhase2Diagnostic.createDiagnosticHook(null),/readState/);
  console.log('Phase 2 browser diagnostic bundle tests passed.');
})().catch(e=>{console.error(e);process.exit(1);});
