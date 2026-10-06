'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createDailyTickReplacementCleanupAuthorization}=require('./hlm-daily-tick-replacement-cleanup-authorization');
const {executeDailyTickReplacementCleanup}=require('./hlm-daily-tick-replacement-cleanup-executor');
const {verifyDailyTickReplacementCleanup}=require('./hlm-daily-tick-replacement-cleanup-verification');
const {completeDailyTickReplacementCleanupTransaction}=require('./hlm-daily-tick-replacement-cleanup-transaction-completion');
function storage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)};}
function fixture(){
 const s=storage(),repository=createBrowserSaveAdapter(s),state=createGameStateEnvelope({meta:{currentDate:'2027-04-18'}});
 repository.save('franchise',state,{saveId:'franchise'});repository.save('daily-tick-staging',state,{saveId:'daily-tick-staging'});
 const checkpoint=Object.freeze({marker:'checkpoint'}),execution=Object.freeze({candidateState:state});
 const replacementCompletion=Object.freeze({kind:'daily-tick-replacement-transaction-completion',version:1,complete:true,days:1,candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-04-17',toDate:'2027-04-18',checkpoint,execution});
 const readiness=Object.freeze({kind:'daily-tick-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,cleanupPerformed:false,days:1,candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-04-17',toDate:'2027-04-18',completion:replacementCompletion,checkpoint,requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})});
 const authorization=createDailyTickReplacementCleanupAuthorization({readiness,approved:true});
 const cleanupExecution=executeDailyTickReplacementCleanup({readiness,authorization,repository});
 return {repository,state,checkpoint,replacementCompletion,readiness,authorization,cleanupExecution};
}
{const f=fixture();const verification=verifyDailyTickReplacementCleanup({execution:f.cleanupExecution,repository:f.repository});
 assert.strictEqual(verification.verified,true);assert.strictEqual(verification.stagingSlotAbsent,true);assert.strictEqual(verification.days,1);
 const completion=completeDailyTickReplacementCleanupTransaction({verification});
 assert.strictEqual(completion.kind,'daily-tick-replacement-cleanup-transaction-completion');assert.strictEqual(completion.complete,true);
 assert.strictEqual(completion.cleanupPerformed,true);assert.strictEqual(completion.cleanupVerified,true);assert.strictEqual(completion.targetPreserved,true);
 assert.strictEqual(completion.checkpoint,f.checkpoint);assert.strictEqual(completion.replacementCompletion,f.replacementCompletion);
 assert.strictEqual(Object.isFrozen(verification),true);assert.strictEqual(Object.isFrozen(completion),true);}
{const f=fixture();assert.throws(()=>verifyDailyTickReplacementCleanup({execution:{...f.cleanupExecution,days:2},repository:f.repository}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_VERIFICATION_FAILED');}
{const f=fixture();const verification=verifyDailyTickReplacementCleanup({execution:f.cleanupExecution,repository:f.repository});
 assert.throws(()=>completeDailyTickReplacementCleanupTransaction({verification:{...verification,days:2}}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');}
console.log('Daily tick cleanup closeout bundle tests passed.');
