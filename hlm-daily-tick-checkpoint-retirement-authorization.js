'use strict';
function err(m){const e=new Error(m);e.code='DAILY_TICK_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED';return e;}
function assertReady(r){if(!r||r.kind!=='daily-tick-checkpoint-retirement-readiness'||r.version!==1||!r.ready||r.retirementPerformed!==false||r.days!==1||
 !r.completion||!r.checkpoint||!r.state||r.requirements?.explicitAuthorizationRequired!==true||r.requirements?.durableTargetMustRemainVerified!==true)throw err('Valid Daily Tick retirement readiness required.');}
function createDailyTickCheckpointRetirementAuthorization({readiness,approved}={}){assertReady(readiness);if(approved!==true)throw err('Explicit retirement approval required.');
 return Object.freeze({kind:'daily-tick-checkpoint-retirement-authorization',version:1,approved:true,executed:false,days:1,readiness,
 completion:readiness.completion,checkpoint:readiness.checkpoint,state:readiness.state,candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,
 storageKey:readiness.storageKey,fromDate:readiness.fromDate,toDate:readiness.toDate});}
function assertDailyTickCheckpointRetirementAuthorized(r,a){assertReady(r);if(!a||a.kind!=='daily-tick-checkpoint-retirement-authorization'||!a.approved||a.executed!==false||
 a.readiness!==r||a.completion!==r.completion||a.checkpoint!==r.checkpoint||a.state!==r.state)throw err('Authorization does not match exact readiness.');return true;}
module.exports={createDailyTickCheckpointRetirementAuthorization,assertDailyTickCheckpointRetirementAuthorized};