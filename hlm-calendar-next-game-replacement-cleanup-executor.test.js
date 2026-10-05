'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextGameCalendarReplacementCleanupAuthorization}=require('./hlm-calendar-next-game-replacement-cleanup-authorization');
const {executeNextGameCalendarReplacementCleanup}=require('./hlm-calendar-next-game-replacement-cleanup-executor');
const {serializeGameState}=require('./hlm-game-state-serialization');
function memoryStorage(){const d=new Map();return{getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
function fixture(){
 const storage=memoryStorage(),repository=createBrowserSaveAdapter(storage);
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
 repository.save('franchise',state,{saveId:'franchise'});repository.save('next-game-staging',state,{saveId:'next-game-staging'});
 const checkpoint=Object.freeze({marker:'checkpoint'}),execution=Object.freeze({candidateState:state,targetGame});
 const completion=Object.freeze({kind:'next-game-calendar-replacement-transaction-completion',complete:true,
  candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,checkpoint,execution});
 const readiness=Object.freeze({kind:'next-game-calendar-replacement-cleanup-readiness',version:1,ready:true,
  cleanupAuthorized:false,cleanupPerformed:false,candidateSlotId:'next-game-staging',targetSlotId:'franchise',
  storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,completion,checkpoint,
  requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})});
 const authorization=createNextGameCalendarReplacementCleanupAuthorization({readiness,approved:true});
 return{storage,repository,state,targetGame,readiness,authorization,checkpoint};
}
{const f=fixture(),before=serializeGameState(f.repository.load('franchise').state),r=executeNextGameCalendarReplacementCleanup(f);
 assert.strictEqual(r.kind,'next-game-calendar-replacement-cleanup-execution');assert.strictEqual(r.executed,true);
 assert.strictEqual(r.verified,true);assert.strictEqual(r.stagingSlotRemoved,true);assert.strictEqual(r.checkpointPreserved,true);
 assert.strictEqual(r.targetGame,f.targetGame);assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.checkpoint,f.checkpoint);
 assert.strictEqual(f.repository.has('next-game-staging'),false);assert.strictEqual(f.repository.has('franchise'),true);
 assert.strictEqual(serializeGameState(f.repository.load('franchise').state),before);assert.strictEqual(Object.isFrozen(r),true);}
{const f=fixture();assert.throws(()=>executeNextGameCalendarReplacementCleanup({...f,authorization:{...f.authorization,approved:false}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED');assert.strictEqual(f.repository.has('next-game-staging'),true);}
{const f=fixture();f.repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}}),{saveId:'franchise'},{replace:true});
 assert.throws(()=>executeNextGameCalendarReplacementCleanup(f),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED');assert.strictEqual(f.repository.has('next-game-staging'),true);}
{const f=fixture();f.repository.remove('next-game-staging');assert.throws(()=>executeNextGameCalendarReplacementCleanup(f),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED');assert.strictEqual(f.repository.has('franchise'),true);}
{const f=fixture();assert.throws(()=>executeNextGameCalendarReplacementCleanup({...f,authorization:{...f.authorization,targetGame:{...f.targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED');assert.strictEqual(f.repository.has('next-game-staging'),true);}
console.log('Next-game calendar replacement cleanup executor tests passed.');
