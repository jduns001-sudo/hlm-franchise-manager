'use strict';
const assert=require('assert');
const { createFrontOfficeDiagnosticHook }=require('./hlm-front-office-diagnostic-hook');

(async()=>{
  const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
  let reads=0;
  const hook=createFrontOfficeDiagnosticHook(async()=>{reads++; return legacy;});
  assert(Object.isFrozen(hook));
  const report=await hook.run();
  assert.strictEqual(report.diagnosticOnly,true);
  assert.strictEqual(report.persistenceEnabled,false);
  assert.strictEqual(report.readOnly,true);
  assert.strictEqual(report.runtime.controlledTeamId,5);
  assert(reads>=1);
  assert.throws(()=>createFrontOfficeDiagnosticHook(null),/readState/);

  let release;
  const waiting=new Promise(resolve=>{release=resolve;});
  const guarded=createFrontOfficeDiagnosticHook(async()=>{await waiting; return legacy;});
  const first=guarded.run();
  await assert.rejects(()=>guarded.run(),e=>e.code==='DIAGNOSTIC_ALREADY_RUNNING');
  release();
  await first;
  console.log('Front Office diagnostic hook tests passed.');
})().catch(e=>{console.error(e);process.exit(1);});
