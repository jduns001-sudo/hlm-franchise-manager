'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluateNextGameCalendarReplacementCleanupReadiness}=require('./hlm-calendar-next-game-replacement-cleanup-readiness');
function memoryStorage(){const d=new Map();return{getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
function build(){
 const storage=memoryStorage(),repository=createBrowserSaveAdapter(storage);
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
 repository.save('franchise',state,{saveId:'franchise'});repository.save('next-game-staging',state,{saveId:'next-game-staging'});
 const checkpoint=Object.freeze({marker:'checkpoint'}),authorization=Object.freeze({targetGame}),execution=Object.freeze({targetGame,candidateState:state});
 const verification=Object.freeze({execution,authorization,checkpoint,targetGame});
 const completion=Object.freeze({kind:'next-game-calendar-replacement-transaction-completion',version:1,complete:true,
  durableVerificationComplete:true,cleanupPerformed:false,checkpointPreserved:true,stagingSlotPreserved:true,
  candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,verification,execution,authorization,checkpoint,state});
 return{storage,repository,state,targetGame,completion};
}
{const f=build(),r=evaluateNextGameCalendarReplacementCleanupReadiness(f);
 assert.strictEqual(r.kind,'next-game-calendar-replacement-cleanup-readiness');assert.strictEqual(r.version,1);
 assert.strictEqual(r.ready,true);assert.strictEqual(r.cleanupAuthorized,false);assert.strictEqual(r.cleanupPerformed,false);
 assert.strictEqual(r.targetGame,f.targetGame);assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.completion,f.completion);
 assert.strictEqual(r.checkpoint,f.completion.checkpoint);assert.strictEqual(r.requirements.explicitCleanupAuthorizationRequired,true);
 assert.strictEqual(r.requirements.targetMustRemainDurable,true);assert.strictEqual(Object.isFrozen(r),true);
 assert.strictEqual(Object.isFrozen(r.requirements),true);assert.strictEqual(f.repository.has('next-game-staging'),true);
 assert.strictEqual(f.repository.has('franchise'),true);}
{const f=build();f.repository.remove('next-game-staging');
 assert.throws(()=>evaluateNextGameCalendarReplacementCleanupReadiness(f),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_NOT_READY');}
{const f=build();f.repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}}),{saveId:'franchise'},{replace:true});
 assert.throws(()=>evaluateNextGameCalendarReplacementCleanupReadiness(f),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_NOT_READY');}
{const f=build();assert.throws(()=>evaluateNextGameCalendarReplacementCleanupReadiness({...f,completion:{...f.completion,targetGame:{...f.targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_NOT_READY');}
console.log('Next-game calendar replacement cleanup readiness tests passed.');
