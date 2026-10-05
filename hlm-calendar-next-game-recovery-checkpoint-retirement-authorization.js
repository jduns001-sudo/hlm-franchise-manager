'use strict';

/**
 * Phase 3 Mission 185: next-game recovery checkpoint retirement authorization.
 * Explicit approval for one exact Mission 184 readiness object. No checkpoint
 * retirement, persistence mutation, deletion, or calendar advancement occurs.
 */
function authorizationError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED';return error;}
function assertRetirementReadiness(readiness){
 if(!readiness||readiness.kind!=='next-game-calendar-recovery-checkpoint-retirement-readiness'||readiness.version!==1||
 readiness.ready!==true||readiness.retirementAuthorized!==false||readiness.retirementPerformed!==false||
 readiness.checkpointStillPreserved!==true||!readiness.targetGame||readiness.targetGame.kind!=='calendar-event'||
 readiness.targetGame.type!=='game'||readiness.targetGame.date!==readiness.toDate||
 !readiness.completion||!readiness.verification||!readiness.checkpoint||!readiness.state||
 readiness.requirements?.explicitRetirementAuthorizationRequired!==true||
 readiness.requirements?.durableTargetMustRemainVerified!==true||
 readiness.completion.verification!==readiness.verification||
 readiness.completion.checkpoint!==readiness.checkpoint||readiness.completion.state!==readiness.state||
 readiness.completion.targetGame!==readiness.targetGame||
 readiness.candidateSlotId!==readiness.completion.candidateSlotId||
 readiness.targetSlotId!==readiness.completion.targetSlotId||
 readiness.storageKey!==readiness.completion.storageKey||
 readiness.fromDate!==readiness.completion.fromDate||readiness.toDate!==readiness.completion.toDate||
 readiness.state.meta?.currentDate!==readiness.toDate)
  throw authorizationError('A valid Mission 184 next-game checkpoint retirement readiness result is required.');
}
function createNextGameCalendarRecoveryCheckpointRetirementAuthorization(input={}){
 const readiness=input.readiness;assertRetirementReadiness(readiness);
 if(input.approved!==true)throw authorizationError('Explicit next-game checkpoint retirement approval is required.');
 return Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-authorization',version:1,approved:true,executed:false,
  checkpointMustRemainPreservedUntilExecution:true,durableTargetMustRemainVerified:true,
  candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,
  fromDate:readiness.fromDate,toDate:readiness.toDate,targetGame:readiness.targetGame,readiness,
  completion:readiness.completion,verification:readiness.verification,checkpoint:readiness.checkpoint,state:readiness.state});
}
function assertNextGameCalendarRecoveryCheckpointRetirementAuthorized(readiness,authorization){
 assertRetirementReadiness(readiness);
 if(!authorization||authorization.kind!=='next-game-calendar-recovery-checkpoint-retirement-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.executed!==false||
 authorization.checkpointMustRemainPreservedUntilExecution!==true||authorization.durableTargetMustRemainVerified!==true||
 authorization.readiness!==readiness||authorization.completion!==readiness.completion||
 authorization.verification!==readiness.verification||authorization.checkpoint!==readiness.checkpoint||
 authorization.state!==readiness.state||authorization.targetGame!==readiness.targetGame||
 authorization.candidateSlotId!==readiness.candidateSlotId||authorization.targetSlotId!==readiness.targetSlotId||
 authorization.storageKey!==readiness.storageKey||authorization.fromDate!==readiness.fromDate||
 authorization.toDate!==readiness.toDate)
  throw authorizationError('Authorization does not match the exact next-game retirement readiness result.');
 return true;
}
module.exports={createNextGameCalendarRecoveryCheckpointRetirementAuthorization,assertNextGameCalendarRecoveryCheckpointRetirementAuthorized};
