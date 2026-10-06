'use strict';

/**
 * Phase 3 Mission 201: daily tick persistence execution authorization.
 * Explicit execution permission only. Performs no persistence writes.
 */
function authorizationError(code,message){const error=new Error(message);error.code=code;return error;}

function assertExecutionPackage(pkg){
 if(!pkg||pkg.kind!=='daily-tick-persistence-execution-package'||pkg.version!==1||
 pkg.packaged!==true||pkg.executable!==false||pkg.days!==1||!pkg.readiness||!pkg.authorization||
 !pkg.candidateState||pkg.candidateState!==pkg.readiness.candidateState||
 pkg.candidateState!==pkg.authorization.candidateState||
 pkg.candidateState.meta?.currentDate!==pkg.toDate||
 pkg.readiness.fromDate!==pkg.fromDate||pkg.readiness.toDate!==pkg.toDate||
 pkg.authorization.fromDate!==pkg.fromDate||pkg.authorization.toDate!==pkg.toDate||
 pkg.transaction?.verifyAfterWrite!==true||pkg.transaction?.rollbackOnFailure!==true||
 pkg.transaction?.executionAuthorizationRequired!==true)
  throw authorizationError('INVALID_DAILY_TICK_PERSISTENCE_EXECUTION_AUTHORIZATION','A valid non-executable Mission 200 daily tick persistence package is required.');
 return pkg;
}

function createDailyTickPersistenceExecutionAuthorization(input={}){
 const pkg=assertExecutionPackage(input.package);
 if(input.approved!==true)
  throw authorizationError('DAILY_TICK_PERSISTENCE_EXECUTION_NOT_APPROVED','Daily tick persistence execution requires explicit approval.');
 return Object.freeze({
  kind:'daily-tick-persistence-execution-authorization',version:1,approved:true,executed:false,
  fromDate:pkg.fromDate,toDate:pkg.toDate,days:1,package:pkg,candidateState:pkg.candidateState
 });
}

function assertDailyTickPersistenceExecutionAuthorized(pkg,authorization){
 const validatedPackage=assertExecutionPackage(pkg);
 if(!authorization||authorization.kind!=='daily-tick-persistence-execution-authorization'||
 authorization.version!==1||authorization.approved!==true||authorization.executed!==false||
 authorization.package!==validatedPackage||
 authorization.candidateState!==validatedPackage.candidateState||
 authorization.fromDate!==validatedPackage.fromDate||
 authorization.toDate!==validatedPackage.toDate||authorization.days!==1)
  throw authorizationError('DAILY_TICK_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH','Execution authorization does not match the exact daily tick persistence package.');
 return true;
}

module.exports={createDailyTickPersistenceExecutionAuthorization,assertDailyTickPersistenceExecutionAuthorized};
