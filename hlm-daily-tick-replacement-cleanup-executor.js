'use strict';
const {assertDailyTickReplacementCleanupAuthorized}=require('./hlm-daily-tick-replacement-cleanup-authorization');
const {createCalendarReplacementCleanupAuthorization}=require('./hlm-calendar-replacement-cleanup-authorization');
const {executeCalendarReplacementCleanup}=require('./hlm-calendar-replacement-cleanup-executor');
function cleanupError(message){const error=new Error(message);error.code='DAILY_TICK_REPLACEMENT_CLEANUP_EXECUTION_FAILED';return error;}
function executeDailyTickReplacementCleanup(input={}){
 const readiness=input.readiness,authorization=input.authorization;
 try{assertDailyTickReplacementCleanupAuthorized(readiness,authorization);}
 catch(_){throw cleanupError('Daily tick cleanup is not authorized for the exact readiness result.');}
 const completion=Object.freeze({...authorization.completion,kind:'calendar-replacement-transaction-completion'});
 const genericReadiness=Object.freeze({...readiness,kind:'calendar-replacement-cleanup-readiness',completion});
 const genericAuthorization=createCalendarReplacementCleanupAuthorization({readiness:genericReadiness,approved:true});
 let result;
 try{result=executeCalendarReplacementCleanup({readiness:genericReadiness,authorization:genericAuthorization,repository:input.repository});}
 catch(cause){const error=cleanupError(cause.message);error.cause=cause;throw error;}
 return Object.freeze({kind:'daily-tick-replacement-cleanup-execution',version:1,executed:true,verified:true,
  stagingSlotRemoved:true,checkpointPreserved:true,days:1,candidateSlotId:authorization.candidateSlotId,
  targetSlotId:authorization.targetSlotId,storageKey:authorization.storageKey,fromDate:authorization.fromDate,
  toDate:authorization.toDate,readiness,authorization,completion:authorization.completion,
  checkpoint:authorization.checkpoint,state:result.state});
}
module.exports={executeDailyTickReplacementCleanup};
