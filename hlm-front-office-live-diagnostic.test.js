'use strict';
const assert=require('assert');

require('./hlm-phase2-browser-diagnostic.js');
require('./hlm-front-office-live-diagnostic.js');

(async()=>{
  assert(global.HFMFrontOfficeDiagnostic);
  const state={
    schema:7,
    players:[{id:1},{id:2}],
    teams:[{id:5}],
    contracts:[{}],
    transactions:[{}],
    draftPicks:[{},{}],
    settings:{controlledTeamId:5}
  };

  const installed=global.HFMFrontOfficeDiagnostic.install(async()=>state);
  assert.strictEqual(installed,global.frontOfficeDiagnostic);
  assert.strictEqual(installed.readOnly,true);
  assert.strictEqual(installed.diagnosticOnly,true);
  assert.strictEqual(installed.persistenceEnabled,false);

  const report=await installed.run();
  assert.strictEqual(report.schema,7);
  assert.strictEqual(report.playerCount,2);
  assert.strictEqual(report.controlledTeamId,5);
  assert.strictEqual(report.persistenceEnabled,false);

  assert.throws(()=>global.HFMFrontOfficeDiagnostic.install(null),/readState/);

  const saved=global.HFMPhase2Diagnostic;
  delete global.HFMPhase2Diagnostic;
  assert.throws(
    ()=>global.HFMFrontOfficeDiagnostic.install(async()=>state),
    e=>e && e.code==='PHASE2_DIAGNOSTIC_BUNDLE_MISSING'
  );
  global.HFMPhase2Diagnostic=saved;

  console.log('Front Office live diagnostic bridge tests passed.');
})().catch(e=>{console.error(e);process.exit(1);});
