'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextGameCalendarPersistenceExecutionAuthorization}=require('./hlm-calendar-next-game-persistence-execution-authorization');
const {executeIsolatedNextGameCalendarPersistence}=require('./hlm-calendar-next-game-persistence-executor');
function buildAuthorizedPackage(){
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
 const readiness=Object.freeze({targetGame,candidateState:state});
 const persistenceAuthorization=Object.freeze({targetGame,candidateState:state});
 const pkg=Object.freeze({kind:'next-game-calendar-persistence-execution-package',version:1,packaged:true,executable:false,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,readiness,authorization:persistenceAuthorization,candidateState:state,
  transaction:Object.freeze({verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true})});
 const authorization=createNextGameCalendarPersistenceExecutionAuthorization({package:pkg,approved:true});
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
const result=executeIsolatedNextGameCalendarPersistence({package:pkg,authorization,repository:repo,slotId:'next-game-isolated-1'});
assert.strictEqual(result.kind,'isolated-next-game-calendar-persistence-execution');assert.strictEqual(result.version,1);
assert.strictEqual(result.executed,true);assert.strictEqual(result.verified,true);assert.strictEqual(result.rolledBack,false);
assert.strictEqual(result.targetGame,pkg.targetGame);assert.strictEqual(result.targetGame.type,'game');
assert.strictEqual(result.package,pkg);assert.strictEqual(result.authorization,authorization);assert.strictEqual(Object.isFrozen(result),true);
assert.strictEqual(repo.slots.get('next-game-isolated-1').state,pkg.candidateState);
assert.throws(()=>executeIsolatedNextGameCalendarPersistence({package:pkg,authorization:{},repository:memoryRepository(),slotId:'x'}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_NOT_AUTHORIZED');
const occupied=memoryRepository();occupied.slots.set('existing',{state:pkg.candidateState});
assert.throws(()=>executeIsolatedNextGameCalendarPersistence({package:pkg,authorization,repository:occupied,slotId:'existing'}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_TARGET_OCCUPIED');
assert.strictEqual(occupied.has('existing'),true);
const corrupt=memoryRepository({corruptLoad:true});
assert.throws(()=>executeIsolatedNextGameCalendarPersistence({package:pkg,authorization,repository:corrupt,slotId:'rollback'}),e=>e.persistenceRolledBack===true);
assert.strictEqual(corrupt.has('rollback'),false);
assert.throws(()=>executeIsolatedNextGameCalendarPersistence({package:pkg,authorization,repository:{},slotId:'x'}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_PERSISTENCE_REPOSITORY');
console.log('Isolated next-game calendar persistence executor tests passed.');
