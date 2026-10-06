'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createDailyTickPersistenceExecutionAuthorization}=require('./hlm-daily-tick-persistence-execution-authorization');
const {executeIsolatedDailyTickPersistence}=require('./hlm-daily-tick-persistence-executor');

function buildAuthorizedPackage(){
 const state=createGameStateEnvelope({meta:{currentDate:'2027-04-18',controlledTeamId:'PIT'},players:[{id:'p1',name:'Player One'}]});
 const verification=Object.freeze({activation:Object.freeze({state})});
 const readiness=Object.freeze({kind:'daily-tick-persistence-readiness',version:1,ready:true,fromDate:'2027-04-17',toDate:'2027-04-18',days:1,
  verification,candidateState:state,requirements:Object.freeze({explicitPersistenceAuthorizationRequired:true,verifyAfterWriteRequired:true,rollbackOnFailureRequired:true})});
 const persistenceAuthorization=Object.freeze({kind:'daily-tick-persistence-authorization',version:1,approved:true,persisted:false,fromDate:'2027-04-17',toDate:'2027-04-18',days:1,readiness,candidateState:state});
 const pkg=Object.freeze({kind:'daily-tick-persistence-execution-package',version:1,packaged:true,executable:false,fromDate:'2027-04-17',toDate:'2027-04-18',days:1,
  readiness,authorization:persistenceAuthorization,candidateState:state,transaction:Object.freeze({verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true})});
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
const result=executeIsolatedDailyTickPersistence({package:pkg,authorization,repository:repo,slotId:'daily-tick-isolated-1'});
assert.strictEqual(result.kind,'isolated-daily-tick-persistence-execution');assert.strictEqual(result.version,1);
assert.strictEqual(result.executed,true);assert.strictEqual(result.verified,true);assert.strictEqual(result.rolledBack,false);assert.strictEqual(result.days,1);
assert.strictEqual(result.fromDate,'2027-04-17');assert.strictEqual(result.toDate,'2027-04-18');
assert.strictEqual(result.package,pkg);assert.strictEqual(result.authorization,authorization);assert.strictEqual(Object.isFrozen(result),true);
assert.strictEqual(repo.slots.get('daily-tick-isolated-1').state,pkg.candidateState);
assert.throws(()=>executeIsolatedDailyTickPersistence({package:pkg,authorization:{},repository:memoryRepository(),slotId:'x'}),e=>e.code==='DAILY_TICK_PERSISTENCE_EXECUTION_NOT_AUTHORIZED');
const occupied=memoryRepository();occupied.slots.set('existing',{state:pkg.candidateState});
assert.throws(()=>executeIsolatedDailyTickPersistence({package:pkg,authorization,repository:occupied,slotId:'existing'}),e=>e.code==='DAILY_TICK_PERSISTENCE_TARGET_OCCUPIED');
assert.strictEqual(occupied.has('existing'),true);
const corrupt=memoryRepository({corruptLoad:true});
assert.throws(()=>executeIsolatedDailyTickPersistence({package:pkg,authorization,repository:corrupt,slotId:'rollback'}),e=>e.persistenceRolledBack===true);
assert.strictEqual(corrupt.has('rollback'),false);
assert.throws(()=>executeIsolatedDailyTickPersistence({package:pkg,authorization,repository:{},slotId:'x'}),e=>e.code==='INVALID_DAILY_TICK_PERSISTENCE_REPOSITORY');
console.log('Isolated daily tick persistence executor tests passed.');
