'use strict';
const {createCPUDecisionCycleAudit}=require('./hlm-cpu-decision-cycle-audit');
const REASONS=Object.freeze({
 candidate:'invalid-or-missing-action-candidate',
 authorization:'human-authorization-required',
 readiness:'execution-readiness-incomplete',
 request:'execution-request-not-accepted',
 preflight:'execution-preflight-failed',
 verification:'execution-verification-failed',
 outcome:'action-not-executed'
});
function createCPUDecisionCycleDiagnostics(state,teamId,options={}){
 const auditPackage=createCPUDecisionCycleAudit(state,teamId,options);
 const blockedStage=auditPackage.audit.firstIncompleteStage;
 const reason=blockedStage?REASONS[blockedStage]:null;
 const status=auditPackage.audit.allGatesPassed?'awaiting-execution':'blocked';
 return Object.freeze({
  kind:'cpu-decision-cycle-diagnostics',version:1,teamId:auditPackage.teamId,auditPackage,
  diagnostics:Object.freeze({status,firstIncompleteStage:blockedStage,reason,
   allGatesPassed:auditPackage.audit.allGatesPassed,actionPerformed:false,
   executorEnabled:false,remediationRequired:status==='blocked'}),
  authority:auditPackage.authority,sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={createCPUDecisionCycleDiagnostics};
