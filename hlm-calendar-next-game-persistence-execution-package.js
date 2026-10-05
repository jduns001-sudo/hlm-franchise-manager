'use strict';

/**
 * Phase 3 Mission 168: next-game persistence execution package.
 * Packages one exact Mission 167-authorized candidate for later execution.
 * Performs no persistence writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertNextGameCalendarPersistenceAuthorized}=require('./hlm-calendar-next-game-persistence-authorization');
function packageError(message){const error=new Error(message);error.code='INVALID_NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_PACKAGE';return error;}
function createNextGameCalendarPersistenceExecutionPackage(input={}){
 const readiness=input.readiness,authorization=input.authorization;
 try{assertNextGameCalendarPersistenceAuthorized(readiness,authorization);}
 catch(_){throw packageError('Exact Mission 167 next-game persistence authorization is required.');}
 const candidateState=readiness.candidateState;
 if(!validateGameStateEnvelope(candidateState).valid||candidateState!==authorization.candidateState||
 readiness.targetGame!==authorization.targetGame||readiness.targetGame.kind!=='calendar-event'||
 readiness.targetGame.type!=='game'||readiness.targetGame.date!==readiness.toDate||
 candidateState.meta.currentDate!==readiness.toDate)
  throw packageError('Authorized next-game candidate GameState is invalid.');
 return Object.freeze({kind:'next-game-calendar-persistence-execution-package',version:1,executable:false,packaged:true,
  fromDate:readiness.fromDate,toDate:readiness.toDate,targetGame:readiness.targetGame,
  readiness,authorization,candidateState,transaction:Object.freeze({
   verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true
  })});
}
module.exports={createNextGameCalendarPersistenceExecutionPackage};
