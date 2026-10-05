'use strict';

/**
 * Phase 3 Mission 167: next-game calendar persistence authorization.
 * Explicit permission only. Performs no persistence writes.
 */
function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}
function assertReadiness(readiness){
 if(!readiness||readiness.kind!=='next-game-calendar-persistence-readiness'||readiness.version!==1||readiness.ready!==true||
 typeof readiness.fromDate!=='string'||typeof readiness.toDate!=='string'||!readiness.targetGame||
 readiness.targetGame.kind!=='calendar-event'||readiness.targetGame.type!=='game'||readiness.targetGame.date!==readiness.toDate||
 !readiness.verification||readiness.targetGame!==readiness.verification.targetGame||!readiness.candidateState||
 readiness.candidateState!==readiness.verification.activation?.state||readiness.candidateState.meta?.currentDate!==readiness.toDate||
 readiness.requirements?.explicitPersistenceAuthorizationRequired!==true||
 readiness.requirements?.verifyAfterWriteRequired!==true||readiness.requirements?.rollbackOnFailureRequired!==true)
  throw authorizationError('INVALID_NEXT_GAME_CALENDAR_PERSISTENCE_AUTHORIZATION','A valid exact Mission 166 next-game persistence readiness result is required.');
 return readiness;
}
function createNextGameCalendarPersistenceAuthorization(input={}){
 const readiness=assertReadiness(input.readiness);
 if(input.approved!==true)throw authorizationError('NEXT_GAME_CALENDAR_PERSISTENCE_NOT_APPROVED','Next-game calendar persistence requires explicit approval.');
 return Object.freeze({kind:'next-game-calendar-persistence-authorization',version:1,approved:true,
  fromDate:readiness.fromDate,toDate:readiness.toDate,targetGame:readiness.targetGame,
  readiness,candidateState:readiness.candidateState});
}
function assertNextGameCalendarPersistenceAuthorized(readiness,authorization){
 const validatedReadiness=assertReadiness(readiness);
 if(!authorization||authorization.kind!=='next-game-calendar-persistence-authorization'||authorization.version!==1||
 authorization.approved!==true||authorization.readiness!==validatedReadiness||
 authorization.targetGame!==validatedReadiness.targetGame||authorization.candidateState!==validatedReadiness.candidateState||
 authorization.fromDate!==validatedReadiness.fromDate||authorization.toDate!==validatedReadiness.toDate)
  throw authorizationError('NEXT_GAME_CALENDAR_PERSISTENCE_AUTHORIZATION_MISMATCH','Persistence authorization does not match the exact next-game readiness result.');
 return true;
}
module.exports={createNextGameCalendarPersistenceAuthorization,assertNextGameCalendarPersistenceAuthorized};
