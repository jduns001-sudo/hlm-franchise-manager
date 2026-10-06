'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createDailyTickPersistenceExecutionAuthorization}=require('./hlm-daily-tick-persistence-execution-authorization');
const {executeIsolatedDailyTickPersistence}=require('./hlm-daily-tick-persistence-executor');

function buildAuthorizedPackage(){
 const state=createGameStateEnvelope({meta:{currentDate:'2027-04-18',controlledTeamId:'PIT'},players:[{id:'p1',name:'Player One'}]});
 const readiness=Object.freeze({fromDate:'2027-04-17',toDate:'2027-04-18',days:1,candidateState:state});
 const persistenceAuthorization=Object.freeze({fromDate:'2027-04-17',toDate:'2027-04-18',days:1,candidateState:state});
 const pkg=Object.freeze({kind:'daily-tick-persistence-execution-package',version:1,packaged:true,executable:false,
  fromDate:'2027-04-17',toDate:'2027-04-18',days:1,readiness,authorization:persistenceAuthorization,candidateState:state,
  transaction:Object.freeze({verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true})});
 const authorization=createDailyTickPersistenceExecutionAuthorization({package:pkg,approved:true});
 return {pkg,authorization};
}
function memoryRepository(options={}){
 const slots=new Map();
 return {slots,has:id=>slots.has(id),
  save(id,state,metadata,saveOptions){assert.strictEqual(saveOptions.replace,false);slots.set(id,{state,metadata});},
  load(id){const value=slots.get(id);if(!value)throw new Error('missing');if(options.corruptLoad)return {state:{broken:true}};return value;},
  remove(id){slots.delete(id);}
 };
}
const {pkg,authorization}=buildAuthorizedPackage();const repo=memoryRepository();
const execution=executeIsolatedDailyTickPersistence({package:pkg,authorization,repository:repo,slotId:'daily-tick-isolated-1'});
const {verifyDailyTickPersistenceExecution}=require('./hlm-daily-tick-persistence-execution-verification');
const verification=verifyDailyTickPersistenceExecution({execution});
assert.strictEqual(verification.kind,'daily-tick-persistence-execution-verification');assert.strictEqual(verification.version,1);assert.strictEqual(verification.verified,true);
assert.strictEqual(verification.exactlyOneDayVerified,true);assert.strictEqual(verification.eventsUnprocessed,true);assert.strictEqual(verification.gameSimulationPerformed,false);assert.strictEqual(verification.universeSystemsProcessed,false);
assert.strictEqual(verification.slotId,'daily-tick-isolated-1');assert.strictEqual(verification.fromDate,'2027-04-17');assert.strictEqual(verification.toDate,'2027-04-18');assert.strictEqual(verification.days,1);
assert.strictEqual(verification.execution,execution);assert.strictEqual(Object.isFrozen(verification),true);
assert.strictEqual(repo.slots.get('daily-tick-isolated-1').state,pkg.candidateState);
assert.throws(()=>verifyDailyTickPersistenceExecution({execution:{...execution,days:2}}),e=>e.code==='DAILY_TICK_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickPersistenceExecution({execution:{...execution,eventsProcessed:true}}),e=>e.code==='DAILY_TICK_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickPersistenceExecution({execution:{...execution,authorization:{...authorization}}}),e=>e.code==='DAILY_TICK_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
console.log('Daily tick persistence execution verification tests passed.');
