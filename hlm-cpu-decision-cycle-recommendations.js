'use strict';
const {createCPUDecisionCycleDiagnostics}=require('./hlm-cpu-decision-cycle-diagnostics');
const NEXT=Object.freeze({
 'invalid-or-missing-action-candidate':'select-valid-action-candidate',
 'human-authorization-required':'request-human-authorization',
 'execution-readiness-incomplete':'review-execution-readiness',
 'execution-request-not-accepted':'review-execution-request',
 'execution-preflight-failed':'review-execution-preflight',
 'execution-verification-failed':'review-execution-verification',
 'action-not-executed':'await-authorized-executor'
});
function createCPUDecisionCycleRecommendations(state,teamId,options={}){
 const diagnosticsPackage=createCPUDecisionCycleDiagnostics(state,teamId,options);
 const d=diagnosticsPackage.diagnostics;
 const nextStep=NEXT[d.reason]??'review-decision-cycle';
 return Object.freeze({
  kind:'cpu-decision-cycle-recommendations',version:1,teamId:diagnosticsPackage.teamId,
  diagnosticsPackage,
  recommendation:Object.freeze({nextStep,reason:d.reason,status:d.status,advisoryOnly:true,
   requiresHumanReview:true,executionEnabled:false,actionPerformed:false}),
  authority:diagnosticsPackage.authority,sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={createCPUDecisionCycleRecommendations};
