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
const {verifyPersistedDailyTickGameStateReload}=require('./hlm-daily-tick-persistence-reload-verification');
const reloadVerification=verifyPersistedDailyTickGameStateReload({verification,repository:repo});
assert.strictEqual(reloadVerification.kind,'persisted-daily-tick-gamestate-reload-verification');assert.strictEqual(reloadVerification.version,1);assert.strictEqual(reloadVerification.verified,true);
assert.strictEqual(reloadVerification.exactlyOneDayVerified,true);assert.strictEqual(reloadVerification.eventsUnprocessed,true);assert.strictEqual(reloadVerification.gameSimulationPerformed,false);assert.strictEqual(reloadVerification.universeSystemsProcessed,false);
assert.strictEqual(reloadVerification.slotId,'daily-tick-isolated-1');assert.strictEqual(reloadVerification.fromDate,'2027-04-17');assert.strictEqual(reloadVerification.toDate,'2027-04-18');assert.strictEqual(reloadVerification.days,1);
assert.strictEqual(reloadVerification.verification,verification);assert.strictEqual(reloadVerification.state,repo.slots.get('daily-tick-isolated-1').state);assert.strictEqual(Object.isFrozen(reloadVerification),true);
assert.throws(()=>verifyPersistedDailyTickGameStateReload({verification:{...verification,days:2},repository:repo}),e=>e.code==='DAILY_TICK_PERSISTENCE_RELOAD_VERIFICATION_FAILED');
assert.throws(()=>verifyPersistedDailyTickGameStateReload({verification,repository:{}}),e=>e.code==='DAILY_TICK_PERSISTENCE_RELOAD_VERIFICATION_FAILED');
const mismatched=memoryRepository();mismatched.slots.set('daily-tick-isolated-1',{state:createGameStateEnvelope({meta:{currentDate:'2027-04-18',controlledTeamId:'NYR'}})});
assert.throws(()=>verifyPersistedDailyTickGameStateReload({verification,repository:mismatched}),e=>e.code==='DAILY_TICK_PERSISTENCE_RELOAD_VERIFICATION_FAILED');
console.log('Persisted daily tick GameState reload verification tests passed.');
