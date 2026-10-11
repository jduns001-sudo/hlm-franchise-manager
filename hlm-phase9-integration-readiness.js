'use strict';
// Phase 9 readiness is evidence-based. An advisory CPU pipeline is not an autonomous league.
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createCPUOrganizationIntelligence}=require('./hlm-cpu-organization-intelligence');
const {createCPUDecisionCycleRecommendations}=require('./hlm-cpu-decision-cycle-recommendations');
const {verifyCPUActionExecutionPackage}=require('./hlm-cpu-action-execution-verification');
const REQUIRED=Object.freeze(['validGameState','organizationAssessment','decisionRecommendation','humanApprovalBoundary','stateUnchanged','persistentCPUExecution','multiSeasonContinuity']);
function assessPhase9Readiness(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)throw new TypeError('Phase 9 requires a valid GameState');
 const before=JSON.stringify(state);
 const intelligence=createCPUOrganizationIntelligence(state,teamId,options.intelligence||{});
 const recommendations=createCPUDecisionCycleRecommendations(state,teamId,options.decision||{});
 const execution=verifyCPUActionExecutionPackage(state,teamId,options.decision||{});
 const checks=Object.freeze({
  validGameState:true,
  organizationAssessment:intelligence.kind==='cpu-organization-intelligence'&&!intelligence.sourceStateMutated,
  decisionRecommendation:recommendations.recommendation.advisoryOnly===true&&!recommendations.recommendation.executionEnabled,
  humanApprovalBoundary:execution.checks.executorDisabled===true&&execution.verification.executionPerformed===false,
  stateUnchanged:before===JSON.stringify(state),
  // No production executor or multi-season CPU persistence has been demonstrated by this audit.
  persistentCPUExecution:false,
  multiSeasonContinuity:false
 });
 const blockers=Object.freeze(REQUIRED.filter(key=>checks[key]!==true));
 return Object.freeze({kind:'phase9-integration-readiness',version:1,teamId:String(teamId),checks,blockers,readyForPhase10:blockers.length===0,advisoryOnly:true,sourceStateMutated:before!==JSON.stringify(state)});
}
module.exports={REQUIRED,assessPhase9Readiness};
