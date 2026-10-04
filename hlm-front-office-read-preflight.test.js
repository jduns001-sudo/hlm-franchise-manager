'use strict';
const assert=require('assert');
const { preflightFrontOfficeState }=require('./hlm-front-office-read-preflight');

(async()=>{
  let reads=0;
  const legacy={players:[{id:1}],teams:[{id:5}],seasons:[],awards:[],transactions:[],draftPicks:[],prospects:[],draftClasses:[],gmSettings:{controlledTeamId:5},contracts:[],snapshot:{},franchiseName:'Test'};
  const report=await preflightFrontOfficeState(async()=>{reads++; return legacy;});
  assert.strictEqual(report.readOnly,true);
  assert.strictEqual(report.runtime.playerCount,1);
  assert.strictEqual(report.runtime.teamCount,1);
  assert.strictEqual(report.runtime.controlledTeamId,5);
  assert.strictEqual(typeof report.ready,'boolean');
  assert.strictEqual(reads,2);
  assert.strictEqual(legacy.players.length,1);

  await assert.rejects(()=>preflightFrontOfficeState(async()=>null),e=>e.code==='INVALID_FRONT_OFFICE_SNAPSHOT');
  console.log('Front Office read preflight tests passed.');
})().catch(e=>{console.error(e);process.exit(1);});
