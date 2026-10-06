'use strict';

/**
 * Phase 3 Mission 203: daily tick persistence execution verification.
 * Independently verifies Mission 202 execution lineage. Performs no writes.
 */
const {assertDailyTickPersistenceExecutionAuthorized}=require('./hlm-daily-tick-persistence-execution-authorization');

function verificationError(message){const error=new Error(message);error.code='DAILY_TICK_PERSISTENCE_EXECUTION_VERIFICATION_FAILED';return error;}

function verifyDailyTickPersistenceExecution(input={}){
 const execution=input.execution;
 if(!execution||execution.kind!=='isolated-daily-tick-persistence-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.rolledBack!==false||
 execution.days!==1||execution.eventsProcessed!==false||execution.gameSimulationPerformed!==false||
 execution.universeSystemsProcessed!==false||typeof execution.slotId!=='string'||!execution.slotId.trim()||
 !execution.package||!execution.authorization)
  throw verificationError('A successful Mission 202 isolated daily tick persistence execution is required.');

 try{assertDailyTickPersistenceExecutionAuthorized(execution.package,execution.authorization);}
 catch(_){throw verificationError('Execution authorization does not match its exact daily tick persistence package.');}

 if(execution.authorization.package!==execution.package||
 execution.package.candidateState!==execution.authorization.candidateState||
 execution.fromDate!==execution.package.fromDate||execution.toDate!==execution.package.toDate||
 execution.package.days!==1||execution.authorization.days!==1||
 execution.package.candidateState.meta?.currentDate!==execution.toDate)
  throw verificationError('Daily tick persistence execution lineage or dates do not match.');

 return Object.freeze({
  kind:'daily-tick-persistence-execution-verification',version:1,verified:true,
  exactlyOneDayVerified:true,eventsUnprocessed:true,gameSimulationPerformed:false,
  universeSystemsProcessed:false,slotId:execution.slotId,fromDate:execution.fromDate,
  toDate:execution.toDate,days:1,execution
 });
}
module.exports={verifyDailyTickPersistenceExecution};
