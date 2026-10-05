'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextGameCalendarPersistenceExecutionAuthorization}=require('./hlm-calendar-next-game-persistence-execution-authorization');
const {executeIsolatedNextGameCalendarPersistence}=require('./hlm-calendar-next-game-persistence-executor');
const {verifyNextGameCalendarPersistenceExecution}=require('./hlm-calendar-next-game-persistence-execution-verification');
const {verifyPersistedNextGameCalendarGameStateReload}=require('./hlm-calendar-next-game-persistence-reload-verification');
function build(){
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
 const readiness=Object.freeze({targetGame,candidateState:state});
 const persistenceAuthorization=Object.freeze({targetGame,candidateState:state});
 const pkg=Object.freeze({kind:'next-game-calendar-persistence-execution-package',version:1,packaged:true,executable:false,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,readiness,authorization:persistenceAuthorization,candidateState:state,
  transaction:Object.freeze({verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true})});
 const authorization=createNextGameCalendarPersistenceExecutionAuthorization({package:pkg,approved:true});
 const slots=new Map();const repository={slots,has:id=>slots.has(id),
  save:(id,savedState,metadata)=>slots.set(id,{state:savedState,metadata}),
  load:id=>{const value=slots.get(id);if(!value)throw new Error('missing');return value;},remove:id=>slots.delete(id)};
 const execution=executeIsolatedNextGameCalendarPersistence({package:pkg,authorization,repository,slotId:'next-game-reload-1'});
 const verification=verifyNextGameCalendarPersistenceExecution({execution});
 return {state,targetGame,repository,execution,verification};
}
const built=build();const reload=verifyPersistedNextGameCalendarGameStateReload({verification:built.verification,repository:built.repository});
assert.strictEqual(reload.kind,'persisted-next-game-calendar-gamestate-reload-verification');assert.strictEqual(reload.version,1);
assert.strictEqual(reload.verified,true);assert.strictEqual(reload.slotId,'next-game-reload-1');
assert.strictEqual(reload.fromDate,'2027-03-03');assert.strictEqual(reload.toDate,'2027-03-05');
assert.strictEqual(reload.targetGame,built.targetGame);assert.strictEqual(reload.targetGame.type,'game');
assert.strictEqual(reload.verification,built.verification);assert.strictEqual(Object.isFrozen(reload),true);
assert.throws(()=>verifyPersistedNextGameCalendarGameStateReload({verification:{...built.verification,targetGame:{...built.targetGame}},repository:built.repository}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED');
const altered=build();altered.repository.slots.set('next-game-reload-1',{state:createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}})});
assert.throws(()=>verifyPersistedNextGameCalendarGameStateReload({verification:altered.verification,repository:altered.repository}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED');
assert.throws(()=>verifyPersistedNextGameCalendarGameStateReload({verification:built.verification,repository:{}}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED');
console.log('Persisted next-game calendar GameState reload verification tests passed.');
