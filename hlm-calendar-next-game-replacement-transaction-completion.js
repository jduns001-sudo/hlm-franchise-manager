'use strict';

/**
 * Phase 3 Mission 178: next-game replacement transaction completion.
 * Finalizes one exact independently verified Mission 177 replacement chain.
 * Performs no persistence writes or cleanup.
 */
function completionError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE';return error;}
function completeNextGameCalendarReplacementTransaction(input={}){
 const verification=input.verification;
 if(!verification||verification.kind!=='existing-slot-next-game-calendar-replacement-verification'||
 verification.version!==1||verification.verified!==true||!verification.targetGame||
 verification.targetGame.kind!=='calendar-event'||verification.targetGame.type!=='game'||
 verification.targetGame.date!==verification.toDate||!verification.execution||!verification.authorization||
 !verification.checkpoint||!verification.state)
  throw completionError('A verified existing-slot next-game calendar replacement is required.');
 const execution=verification.execution,authorization=verification.authorization;
 if(execution.kind!=='existing-slot-next-game-calendar-replacement-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.rolledBack!==false||
 execution.authorization!==authorization||execution.checkpoint!==verification.checkpoint||
 execution.targetGame!==verification.targetGame||authorization.approved!==true||
 authorization.targetGame!==verification.targetGame||authorization.candidateState!==execution.candidateState||
 verification.candidateSlotId!==execution.candidateSlotId||verification.targetSlotId!==execution.targetSlotId||
 verification.storageKey!==execution.storageKey||verification.fromDate!==execution.fromDate||
 verification.toDate!==execution.toDate||verification.state.meta?.currentDate!==verification.toDate)
  throw completionError('Next-game replacement verification lineage is inconsistent.');
 return Object.freeze({kind:'next-game-calendar-replacement-transaction-completion',version:1,complete:true,
  durableVerificationComplete:true,cleanupPerformed:false,checkpointPreserved:true,stagingSlotPreserved:true,
  candidateSlotId:verification.candidateSlotId,targetSlotId:verification.targetSlotId,storageKey:verification.storageKey,
  fromDate:verification.fromDate,toDate:verification.toDate,targetGame:verification.targetGame,verification,execution,
  authorization,checkpoint:verification.checkpoint,state:verification.state});
}
module.exports={completeNextGameCalendarReplacementTransaction};
