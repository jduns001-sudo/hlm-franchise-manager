'use strict';

/**
 * Phase 3 Mission 171: next-game persistence execution verification.
 * Independently verifies Mission 170 execution lineage. Performs no writes.
 */
const {assertNextGameCalendarPersistenceExecutionAuthorized}=require('./hlm-calendar-next-game-persistence-execution-authorization');
function verificationError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_VERIFICATION_FAILED';return error;}
function verifyNextGameCalendarPersistenceExecution(input={}){
 const execution=input.execution;
 if(!execution||execution.kind!=='isolated-next-game-calendar-persistence-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.rolledBack!==false||
 typeof execution.slotId!=='string'||!execution.slotId.trim()||!execution.targetGame||
 execution.targetGame.kind!=='calendar-event'||execution.targetGame.type!=='game'||!execution.package||!execution.authorization)
  throw verificationError('A successful Mission 170 isolated next-game persistence execution is required.');
 try{assertNextGameCalendarPersistenceExecutionAuthorized(execution.package,execution.authorization);}
 catch(_){throw verificationError('Execution authorization does not match its exact next-game persistence package.');}
 if(execution.authorization.package!==execution.package||execution.targetGame!==execution.package.targetGame||
 execution.targetGame!==execution.authorization.targetGame||execution.targetGame.date!==execution.toDate||
 execution.package.candidateState!==execution.authorization.candidateState||
 execution.fromDate!==execution.package.fromDate||execution.toDate!==execution.package.toDate||
 execution.package.candidateState.meta?.currentDate!==execution.toDate)
  throw verificationError('Next-game persistence execution lineage, target game, or dates do not match.');
 return Object.freeze({kind:'next-game-calendar-persistence-execution-verification',version:1,verified:true,
  slotId:execution.slotId,fromDate:execution.fromDate,toDate:execution.toDate,targetGame:execution.targetGame,execution});
}
module.exports={verifyNextGameCalendarPersistenceExecution};
