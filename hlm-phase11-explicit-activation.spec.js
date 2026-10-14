'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const code=fs.readFileSync('hlm-phase11-explicit-activation.js','utf8');
test('default disabled and GM phrase required before any reads or writes',async({page})=>{
 await page.goto('about:blank');await page.addScriptTag({content:code});
 const result=await page.evaluate(async()=>{
  let calls=0;const service={createController:()=>({commit:()=>{calls++;return {committed:true}},rollback:()=>{calls++;return {rolledBack:true}}})};
  const disabled=HLMPhase11ExplicitActivation.create({atomic:service});
  let blocked=false;try{await disabled.activate({gmApproval:'I AUTHORIZE PRODUCTION ROSTER IMPORT',reopenedBackupText:'{}'})}catch{blocked=true}
  let rollbackBlocked=false;try{await disabled.rollback({gmApproval:'I AUTHORIZE PRODUCTION ROLLBACK'})}catch{rollbackBlocked=true}
  const enabled=HLMPhase11ExplicitActivation.create({enabled:true,atomic:service});
  let missingApproval=false;try{await enabled.activate({reopenedBackupText:'{}'})}catch{missingApproval=true}
  return {blocked,rollbackBlocked,missingApproval,calls,defaultEnabled:HLMPhase11ExplicitActivation.enabledByDefault};
 });expect(result).toEqual({blocked:true,rollbackBlocked:true,missingApproval:true,calls:0,defaultEnabled:false});
});
test('enabled test-only gate validates reopened backup and preflight before atomic commit',async({page})=>{
 await page.goto('about:blank');await page.addScriptTag({content:code});
 const result=await page.evaluate(async()=>{
  const events=[],candidate={schema:7,settings:{controlledTeamId:42},customPlayers:[{id:9001,teamId:42}]},current={schema:7,settings:{controlledTeamId:42},customPlayers:[]};
  const atomic={verifyCandidate:()=>events.push('candidate'),verifyBackup:async()=>events.push('backup'),createController:()=>({commit:async()=>{events.push('commit');return {committed:true}},rollback:async()=>{events.push('rollback');return {rolledBack:true}}})};
  const integration={verifyReopenedBackup:async()=>{events.push('reopened');return {cutoverBackupText:'verified'}},preflight:async()=>{events.push('preflight');return {candidate,addedPlayers:1,controlledTeamId:42}}};
  const finalGate={validate:async()=>{events.push('gate');return {readyForControlledTest:true,productionActivationEnabled:false,addedPlayers:1,controlledTeamId:42}}};
  const workbench={current:async()=>current};
  const api=HLMPhase11ExplicitActivation.create({enabled:true,atomic,integration,finalGate,workbench});
  const commit=await api.activate({reopenedBackupText:'reopened file',gmApproval:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});
  const rollback=await api.rollback({gmApproval:'I AUTHORIZE PRODUCTION ROLLBACK'});
  return {commit,rollback,events};
 });
 expect(result.commit.committed).toBe(true);expect(result.commit.requiresReload).toBe(true);expect(result.rollback.rolledBack).toBe(true);
 expect(result.events).toEqual(['gate','reopened','preflight','candidate','backup','commit','rollback']);
});
