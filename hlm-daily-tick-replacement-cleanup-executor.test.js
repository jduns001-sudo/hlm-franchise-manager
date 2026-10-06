'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createDailyTickReplacementCleanupAuthorization}=require('./hlm-daily-tick-replacement-cleanup-authorization');
const {executeDailyTickReplacementCleanup}=require('./hlm-daily-tick-replacement-cleanup-executor');
function memoryStorage(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
function fixture(){
 const storage=memoryStorage(),repository=createBrowserSaveAdapter(storage);
 const state=createGameStateEnvelope({meta:{currentDate:'2027-04-18',controlledTeamId:'PIT'}});
 repository.save('franchise',state,{saveId:'franchise'});repository.save('daily-tick-staging',state,{saveId:'daily-tick-staging'});
 const checkpoint=Object.freeze({marker:'daily-tick-checkpoint'});
 const execution=Object.freeze({candidateState:state});
 const completion=Object.freeze({kind:'daily-tick-replacement-transaction-completion',version:1,complete:true,days:1,
  candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-04-17',toDate:'2027-04-18',checkpoint,execution});
 const readiness=Object.freeze({kind:'daily-tick-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,cleanupPerformed:false,days:1,
  candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-04-17',toDate:'2027-04-18',completion,checkpoint,
  requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})});
 const authorization=createDailyTickReplacementCleanupAuthorization({readiness,approved:true});
 return {storage,repository,state,readiness,authorization,checkpoint};
}
{const f=fixture();const before=serializeGameState(f.repository.load('franchise').state);const result=executeDailyTickReplacementCleanup(f);
 assert.strictEqual(result.kind,'daily-tick-replacement-cleanup-execution');assert.strictEqual(result.executed,true);assert.strictEqual(result.verified,true);
 assert.strictEqual(result.stagingSlotRemoved,true);assert.strictEqual(result.checkpointPreserved,true);assert.strictEqual(result.days,1);
 assert.strictEqual(result.checkpoint,f.checkpoint);assert.strictEqual(f.repository.has('daily-tick-staging'),false);assert.strictEqual(f.repository.has('franchise'),true);
 assert.strictEqual(serializeGameState(f.repository.load('franchise').state),before);assert.strictEqual(Object.isFrozen(result),true);}
{const f=fixture();assert.throws(()=>executeDailyTickReplacementCleanup({...f,authorization:{...f.authorization,approved:false}}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_EXECUTION_FAILED');assert.strictEqual(f.repository.has('daily-tick-staging'),true);}
{const f=fixture();f.repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-04-18'},extensions:{tampered:true}}),{saveId:'franchise'},{replace:true});
 assert.throws(()=>executeDailyTickReplacementCleanup(f),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_EXECUTION_FAILED');assert.strictEqual(f.repository.has('daily-tick-staging'),true);}
console.log('Daily tick replacement cleanup executor tests passed.');
