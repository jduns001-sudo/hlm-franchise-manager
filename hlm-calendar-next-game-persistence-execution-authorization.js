'use strict';

/**
 * Phase 3 Mission 169: next-game persistence execution authorization.
 * Explicit execution permission only. Performs no persistence writes.
 */
function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}
function assertExecutionPackage(pkg){
 if(!pkg||pkg.kind!=='next-game-calendar-persistence-execution-package'||pkg.version!==1||
 pkg.packaged!==true||pkg.executable!==false||!pkg.targetGame||pkg.targetGame.kind!=='calendar-event'||
 pkg.targetGame.type!=='game'||pkg.targetGame.date!==pkg.toDate||!pkg.readiness||!pkg.authorization||
 !pkg.candidateState||pkg.targetGame!==pkg.readiness.targetGame||pkg.targetGame!==pkg.authorization.targetGame||
 pkg.candidateState!==pkg.readiness.candidateState||pkg.candidateState!==pkg.authorization.candidateState||
 pkg.candidateState.meta?.currentDate!==pkg.toDate||pkg.transaction?.verifyAfterWrite!==true||
 pkg.transaction?.rollbackOnFailure!==true||pkg.transaction?.executionAuthorizationRequired!==true)
  throw authorizationError('INVALID_NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION','A valid non-executable Mission 168 next-game persistence package is required.');
 return pkg;
}
function createNextGameCalendarPersistenceExecutionAuthorization(input={}){
 const pkg=assertExecutionPackage(input.package);
 if(input.approved!==true)throw authorizationError('NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_NOT_APPROVED','Next-game calendar persistence execution requires explicit approval.');
 return Object.freeze({kind:'next-game-calendar-persistence-execution-authorization',version:1,approved:true,
  fromDate:pkg.fromDate,toDate:pkg.toDate,targetGame:pkg.targetGame,package:pkg,candidateState:pkg.candidateState});
}
function assertNextGameCalendarPersistenceExecutionAuthorized(pkg,authorization){
 const validatedPackage=assertExecutionPackage(pkg);
 if(!authorization||authorization.kind!=='next-game-calendar-persistence-execution-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.package!==validatedPackage||
 authorization.targetGame!==validatedPackage.targetGame||authorization.candidateState!==validatedPackage.candidateState||
 authorization.fromDate!==validatedPackage.fromDate||authorization.toDate!==validatedPackage.toDate)
  throw authorizationError('NEXT_GAME_CALENDAR_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH','Execution authorization does not match the exact next-game persistence package.');
 return true;
}
module.exports={createNextGameCalendarPersistenceExecutionAuthorization,assertNextGameCalendarPersistenceExecutionAuthorized};
