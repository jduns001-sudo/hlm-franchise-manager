'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextGameCalendarPersistenceRecoveryCheckpoint}=require('./hlm-calendar-next-game-persistence-recovery-checkpoint');
const {createExistingSlotNextGameCalendarReplacementAuthorization}=require('./hlm-calendar-next-game-replacement-authorization');
const {executeExistingSlotNextGameCalendarReplacement}=require('./hlm-calendar-next-game-replacement-executor');
const {verifyExistingSlotNextGameCalendarReplacement}=require('./hlm-calendar-next-game-replacement-verification');
function memoryStorage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)};}
function build(){
 const storage=memoryStorage(),repository=createBrowserSaveAdapter(storage);
 const oldState=createGameStateEnvelope({meta:{currentDate:'2027-03-03',controlledTeamId:'PIT'}});
 const candidateState=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
 repository.save('franchise',oldState,{saveId:'franchise'});repository.save('next-game-staging',candidateState,{saveId:'next-game-staging'});
 const checkpoint=createNextGameCalendarPersistenceRecoveryCheckpoint({storage,storageKey:DEFAULT_STORAGE_KEY,slotId:'franchise'});
 const reloadVerification=Object.freeze({slotId:'next-game-staging',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,state:candidateState});
 const readiness=Object.freeze({kind:'existing-slot-next-game-calendar-replacement-readiness',version:1,ready:true,
  replacementAuthorized:false,replacementPerformed:false,candidateSlotId:'next-game-staging',targetSlotId:'franchise',
  storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,reloadVerification,checkpoint,
  requirements:Object.freeze({explicitReplacementAuthorizationRequired:true,verifyAfterReplacementRequired:true,restoreCheckpointOnFailureRequired:true})});
 const authorization=createExistingSlotNextGameCalendarReplacementAuthorization({readiness,approved:true});
 const execution=executeExistingSlotNextGameCalendarReplacement({readiness,authorization,repository,storage});
 return {storage,repository,candidateState,targetGame,execution};
}
{const f=build(),v=verifyExistingSlotNextGameCalendarReplacement(f);
 assert.strictEqual(v.kind,'existing-slot-next-game-calendar-replacement-verification');assert.strictEqual(v.version,1);
 assert.strictEqual(v.verified,true);assert.strictEqual(v.targetGame,f.targetGame);assert.strictEqual(v.targetGame.type,'game');
 assert.strictEqual(v.execution,f.execution);assert.strictEqual(v.authorization,f.execution.authorization);
 assert.strictEqual(v.checkpoint,f.execution.checkpoint);assert.notStrictEqual(v.state,f.candidateState);assert.strictEqual(Object.isFrozen(v),true);}
{const f=build();const tampered=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}});
 f.repository.save('franchise',tampered,{saveId:'franchise'},{replace:true});
 assert.throws(()=>verifyExistingSlotNextGameCalendarReplacement(f),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_VERIFICATION_FAILED');}
{const f=build();assert.throws(()=>verifyExistingSlotNextGameCalendarReplacement({...f,execution:{...f.execution,targetGame:{...f.targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_VERIFICATION_FAILED');}
{const f=build();assert.throws(()=>verifyExistingSlotNextGameCalendarReplacement({...f,repository:{...f.repository,storageKey:'wrong-key'}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_VERIFICATION_FAILED');}
console.log('Existing-slot next-game calendar replacement verification tests passed.');
