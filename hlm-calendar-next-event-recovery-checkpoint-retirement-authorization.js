'use strict';

/**
 * Phase 3 Mission 153: next-event recovery checkpoint retirement authorization.
 * Explicit approval for one exact Mission 152 readiness object. No checkpoint
 * retirement, persistence mutation, deletion, or calendar advancement occurs.
 */

function authorizationError(message){const error=new Error(message);error.code='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED';return error;}

function assertRetirementReadiness(readiness){
 if(
  !readiness||readiness.kind!=='next-event-calendar-recovery-checkpoint-retirement-readiness'||readiness.version!==1||
  readiness.ready!==true||readiness.retirementAuthorized!==false||readiness.retirementPerformed!==false||
  readiness.checkpointStillPreserved!==true||!readiness.targetEvent||readiness.targetEvent.date!==readiness.toDate||
  !readiness.completion||!readiness.verification||!readiness.checkpoint||!readiness.state||
  readiness.requirements?.explicitRetirementAuthorizationRequired!==true||
  readiness.requirements?.durableTargetMustRemainVerified!==true||
  readiness.completion.verification!==readiness.verification||
  readiness.completion.checkpoint!==readiness.checkpoint||readiness.completion.state!==readiness.state||
  readiness.completion.targetEvent!==readiness.targetEvent||
  readiness.candidateSlotId!==readiness.completion.candidateSlotId||
  readiness.targetSlotId!==readiness.completion.targetSlotId||
  readiness.storageKey!==readiness.completion.storageKey||
  readiness.fromDate!==readiness.completion.fromDate||readiness.toDate!==readiness.completion.toDate||
  readiness.state.meta?.currentDate!==readiness.toDate
 )throw authorizationError('A valid Mission 152 next-event checkpoint retirement readiness result is required.');
}

function createNextEventCalendarRecoveryCheckpointRetirementAuthorization(input={}){
 const readiness=input.readiness;assertRetirementReadiness(readiness);
 if(input.approved!==true)throw authorizationError('Explicit next-event checkpoint retirement approval is required.');
 return Object.freeze({
  kind:'next-event-calendar-recovery-checkpoint-retirement-authorization',version:1,approved:true,executed:false,
  checkpointMustRemainPreservedUntilExecution:true,durableTargetMustRemainVerified:true,
  candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,
  fromDate:readiness.fromDate,toDate:readiness.toDate,targetEvent:readiness.targetEvent,readiness,
  completion:readiness.completion,verification:readiness.verification,checkpoint:readiness.checkpoint,state:readiness.state
 });
}

function assertNextEventCalendarRecoveryCheckpointRetirementAuthorized(readiness,authorization){
 assertRetirementReadiness(readiness);
 if(
  !authorization||authorization.kind!=='next-event-calendar-recovery-checkpoint-retirement-authorization'||
  authorization.version!==1||authorization.approved!==true||authorization.executed!==false||
  authorization.checkpointMustRemainPreservedUntilExecution!==true||authorization.durableTargetMustRemainVerified!==true||
  authorization.readiness!==readiness||authorization.completion!==readiness.completion||
  authorization.verification!==readiness.verification||authorization.checkpoint!==readiness.checkpoint||
  authorization.state!==readiness.state||authorization.targetEvent!==readiness.targetEvent||
  authorization.candidateSlotId!==readiness.candidateSlotId||authorization.targetSlotId!==readiness.targetSlotId||
  authorization.storageKey!==readiness.storageKey||authorization.fromDate!==readiness.fromDate||
  authorization.toDate!==readiness.toDate
 )throw authorizationError('Authorization does not match the exact next-event retirement readiness result.');
 return true;
}
module.exports={createNextEventCalendarRecoveryCheckpointRetirementAuthorization,assertNextEventCalendarRecoveryCheckpointRetirementAuthorized};
