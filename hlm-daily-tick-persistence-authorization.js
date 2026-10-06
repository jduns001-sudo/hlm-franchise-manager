'use strict';

/**
 * Phase 3 Mission 199: daily tick persistence authorization.
 * Explicit permission only. Binds the exact Mission 198 readiness receipt.
 * Performs no persistence writes.
 */
function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}

function assertReadiness(readiness){
 if(!readiness||readiness.kind!=='daily-tick-persistence-readiness'||readiness.version!==1||
 readiness.ready!==true||readiness.days!==1||typeof readiness.fromDate!=='string'||
 typeof readiness.toDate!=='string'||!readiness.verification||!readiness.candidateState||
 readiness.candidateState!==readiness.verification.activation?.state||
 readiness.candidateState.meta?.currentDate!==readiness.toDate||
 readiness.requirements?.explicitPersistenceAuthorizationRequired!==true||
 readiness.requirements?.verifyAfterWriteRequired!==true||
 readiness.requirements?.rollbackOnFailureRequired!==true)
  throw authorizationError('INVALID_DAILY_TICK_PERSISTENCE_AUTHORIZATION','A valid exact Mission 198 daily tick persistence readiness result is required.');
 return readiness;
}

function createDailyTickPersistenceAuthorization(input={}){
 const readiness=assertReadiness(input.readiness);
 if(input.approved!==true)
  throw authorizationError('DAILY_TICK_PERSISTENCE_NOT_APPROVED','Daily tick persistence requires explicit approval.');
 return Object.freeze({
  kind:'daily-tick-persistence-authorization',version:1,approved:true,persisted:false,
  fromDate:readiness.fromDate,toDate:readiness.toDate,days:1,
  readiness,candidateState:readiness.candidateState
 });
}

function assertDailyTickPersistenceAuthorized(readiness,authorization){
 const validatedReadiness=assertReadiness(readiness);
 if(!authorization||authorization.kind!=='daily-tick-persistence-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.persisted!==false||
 authorization.readiness!==validatedReadiness||
 authorization.candidateState!==validatedReadiness.candidateState||
 authorization.fromDate!==validatedReadiness.fromDate||
 authorization.toDate!==validatedReadiness.toDate||authorization.days!==1)
  throw authorizationError('DAILY_TICK_PERSISTENCE_AUTHORIZATION_MISMATCH','Persistence authorization does not match the exact daily tick readiness result.');
 return true;
}

module.exports={createDailyTickPersistenceAuthorization,assertDailyTickPersistenceAuthorized};
