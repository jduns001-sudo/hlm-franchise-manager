'use strict';

/**
 * Phase 3 Mission 200: daily tick persistence execution package.
 * Packages one exact Mission 199-authorized candidate for later execution.
 * Performs no persistence writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertDailyTickPersistenceAuthorized}=require('./hlm-daily-tick-persistence-authorization');

function packageError(message){const error=new Error(message);error.code='INVALID_DAILY_TICK_PERSISTENCE_EXECUTION_PACKAGE';return error;}

function createDailyTickPersistenceExecutionPackage(input={}){
 const readiness=input.readiness,authorization=input.authorization;
 try{assertDailyTickPersistenceAuthorized(readiness,authorization);}
 catch(_){throw packageError('Exact Mission 199 daily tick persistence authorization is required.');}

 const candidateState=readiness.candidateState;
 if(!validateGameStateEnvelope(candidateState).valid||
 candidateState!==authorization.candidateState||readiness.days!==1||authorization.days!==1||
 candidateState.meta.currentDate!==readiness.toDate)
  throw packageError('Authorized daily tick candidate GameState is invalid.');

 return Object.freeze({
  kind:'daily-tick-persistence-execution-package',version:1,executable:false,packaged:true,
  fromDate:readiness.fromDate,toDate:readiness.toDate,days:1,
  readiness,authorization,candidateState,
  transaction:Object.freeze({
   verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true
  })
 });
}
module.exports={createDailyTickPersistenceExecutionPackage};
