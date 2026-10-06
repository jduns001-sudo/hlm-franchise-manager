'use strict';
const assert=require('assert');const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluateDailyTickCheckpointRetirementReadiness}=require('./hlm-daily-tick-checkpoint-retirement-readiness');
const {createDailyTickCheckpointRetirementAuthorization}=require('./hlm-daily-tick-checkpoint-retirement-authorization');
const {executeDailyTickCheckpointRetirement}=require('./hlm-daily-tick-checkpoint-retirement-execution');
const {verifyDailyTickCheckpointRetirement}=require('./hlm-daily-tick-checkpoint-retirement-verification');
const {completeDailyTickCheckpointRetirementTransaction}=require('./hlm-daily-tick-checkpoint-retirement-transaction-completion');
function storage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)};}
function fixture(){const repository=createBrowserSaveAdapter(storage()),state=createGameStateEnvelope({meta:{currentDate:'2027-04-18'}});repository.save('franchise',state,{saveId:'franchise'});
 const checkpoint=Object.freeze({raw:'audit-lineage'}),verification=Object.freeze({marker:'cleanup-verification'}),execution=Object.freeze({marker:'cleanup-execution'});
 const cleanup=Object.freeze({kind:'daily-tick-replacement-cleanup-transaction-completion',version:1,complete:true,cleanupPerformed:true,cleanupVerified:true,
 stagingSlotRemoved:true,targetPreserved:true,checkpointPreserved:true,lineageIntact:true,days:1,candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',
 storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-04-17',toDate:'2027-04-18',verification,execution,readiness:Object.freeze({}),authorization:Object.freeze({}),
 replacementCompletion:Object.freeze({}),checkpoint,state});return {repository,state,checkpoint,cleanup};}
{const f=fixture();const readiness=evaluateDailyTickCheckpointRetirementReadiness({completion:f.cleanup});
 const authorization=createDailyTickCheckpointRetirementAuthorization({readiness,approved:true});
 const execution=executeDailyTickCheckpointRetirement({readiness,authorization,repository:f.repository});
 const verification=verifyDailyTickCheckpointRetirement({execution,repository:f.repository});
 const completion=completeDailyTickCheckpointRetirementTransaction({verification});
 assert.strictEqual(readiness.ready,true);assert.strictEqual(authorization.approved,true);assert.strictEqual(execution.storageDeleted,false);
 assert.strictEqual(verification.storagePreserved,true);assert.strictEqual(completion.complete,true);assert.strictEqual(completion.rollbackAuthorityRetired,true);
 assert.strictEqual(completion.retiredCheckpoint,f.checkpoint);assert.strictEqual(f.repository.has('franchise'),true);assert.strictEqual(f.repository.has('daily-tick-staging'),false);
 for(const x of [readiness,authorization,execution,verification,completion])assert.strictEqual(Object.isFrozen(x),true);}
{const f=fixture();const readiness=evaluateDailyTickCheckpointRetirementReadiness({completion:f.cleanup});
 assert.throws(()=>createDailyTickCheckpointRetirementAuthorization({readiness,approved:false}),e=>e.code==='DAILY_TICK_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');}
{const f=fixture();const readiness=evaluateDailyTickCheckpointRetirementReadiness({completion:f.cleanup});const authorization=createDailyTickCheckpointRetirementAuthorization({readiness,approved:true});
 f.repository.save('daily-tick-staging',f.state,{saveId:'daily-tick-staging'});
 assert.throws(()=>executeDailyTickCheckpointRetirement({readiness,authorization,repository:f.repository}),e=>e.code==='DAILY_TICK_CHECKPOINT_RETIREMENT_EXECUTION_FAILED');}
console.log('Daily tick checkpoint retirement bundle tests passed.');
