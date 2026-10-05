'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextGameCalendarPersistenceExecutionAuthorization}=require('./hlm-calendar-next-game-persistence-execution-authorization');
const {executeIsolatedNextGameCalendarPersistence}=require('./hlm-calendar-next-game-persistence-executor');
const {verifyNextGameCalendarPersistenceExecution}=require('./hlm-calendar-next-game-persistence-execution-verification');
function buildExecution(){
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
 const readiness=Object.freeze({targetGame,candidateState:state});
 const persistenceAuthorization=Object.freeze({targetGame,candidateState:state});
 const pkg=Object.freeze({kind:'next-game-calendar-persistence-execution-package',version:1,packaged:true,executable:false,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,readiness,authorization:persistenceAuthorization,candidateState:state,
  transaction:Object.freeze({verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true})});
 const authorization=createNextGameCalendarPersistenceExecutionAuthorization({package:pkg,approved:true});
 const slots=new Map();
 const repository={has:id=>slots.has(id),save:(id,savedState,metadata)=>slots.set(id,{state:savedState,metadata}),load:id=>slots.get(id),remove:id=>slots.delete(id)};
 return executeIsolatedNextGameCalendarPersistence({package:pkg,authorization,repository,slotId:'next-game-verification-1'});
}
const execution=buildExecution();const verification=verifyNextGameCalendarPersistenceExecution({execution});
assert.strictEqual(verification.kind,'next-game-calendar-persistence-execution-verification');assert.strictEqual(verification.version,1);
assert.strictEqual(verification.verified,true);assert.strictEqual(verification.slotId,'next-game-verification-1');
assert.strictEqual(verification.fromDate,'2027-03-03');assert.strictEqual(verification.toDate,'2027-03-05');
assert.strictEqual(verification.targetGame,execution.targetGame);assert.strictEqual(verification.targetGame.type,'game');
assert.strictEqual(verification.execution,execution);assert.strictEqual(Object.isFrozen(verification),true);
assert.throws(()=>verifyNextGameCalendarPersistenceExecution({execution:{...execution,verified:false}}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarPersistenceExecution({execution:{...execution,slotId:''}}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarPersistenceExecution({execution:{...execution,toDate:'2027-03-06'}}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarPersistenceExecution({execution:{...execution,targetGame:{...execution.targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarPersistenceExecution({execution:{...execution,package:{...execution.package}}}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarPersistenceExecution({}),e=>e.code==='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED');
console.log('Next-game calendar persistence execution verification tests passed.');
