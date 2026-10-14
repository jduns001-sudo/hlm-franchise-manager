'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const code=fs.readFileSync('hlm-phase11-explicit-activation.js','utf8');
test('late candidate mutation is rejected before atomic commit',async({page})=>{
 await page.goto('about:blank');await page.addScriptTag({content:code});
 const result=await page.evaluate(async()=>{
  let calls=0,commits=0;
  const base={schema:7,settings:{controlledTeamId:42},customPlayers:[]};
  const a={...base,customPlayers:[{id:9001,teamId:42}]};
  const b={...base,customPlayers:[{id:9002,teamId:42}]};
  const integration={verifyReopenedBackup:async()=>({cutoverBackupText:'verified'}),preflight:async()=>({candidate:++calls===1?a:b,addedPlayers:1,controlledTeamId:42})};
  const finalGate={validate:async()=>({readyForControlledTest:true,productionActivationEnabled:false,addedPlayers:1,controlledTeamId:42})};
  const atomic={verifyCandidate:()=>{},verifyBackup:async()=>{},createController:()=>({commit:async()=>{commits++;return {committed:true}}})};
  try{await HLMPhase11ExplicitActivation.create({enabled:true,integration,finalGate,atomic,workbench:{current:async()=>base}}).activate({reopenedBackupText:'verified',gmApproval:'I AUTHORIZE PRODUCTION ROSTER IMPORT'});return {rejected:false,commits}}catch(e){return {rejected:e.message.includes('changed'),commits}}
 });expect(result).toEqual({rejected:true,commits:0});
});
