'use strict';
const {createFranchiseManagementSnapshot}=require('./hlm-franchise-management-foundation');
const {createRosterStatusSnapshot}=require('./hlm-roster-status-foundation');
const {createRosterConfigurationSnapshot,createPlayerRelationshipSnapshot}=require('./hlm-roster-configuration-relationships-foundation');
const {createContractCapPlanningSnapshot}=require('./hlm-contract-cap-planning-foundation');
const {createRosterOperationCandidate}=require('./hlm-roster-operations-candidates');
const {createOrganizationLeadershipSnapshot}=require('./hlm-organization-leadership-foundation');
const {createFranchiseAIAnalysis}=require('./hlm-franchise-ai-analysis-foundation');
const {createFranchiseActionTransaction,verifyFranchiseActionTransaction,authorizeFranchiseAction}=require('./hlm-franchise-action-transaction');
function createPhase6IntegrationExitGate(state,teamId,options={}){
 const before=JSON.stringify(state);
 const franchise=createFranchiseManagementSnapshot(state,teamId);
 const roster=createRosterStatusSnapshot(state,teamId,options.rosterStatus||{});
 const configuration=createRosterConfigurationSnapshot(state,teamId,options.configuration||{});
 const relationships=createPlayerRelationshipSnapshot(state,teamId,options.relationships||{});
 const cap=createContractCapPlanningSnapshot(state,teamId,options.cap||{});
 const leadership=createOrganizationLeadershipSnapshot(state,teamId,options.leadership||{});
 const ai=createFranchiseAIAnalysis(state,teamId,options.ai||{});
 const action=createRosterOperationCandidate(state,{...(options.action||{}),teamId});
 const transaction=createFranchiseActionTransaction(state,action);
 const verification=verifyFranchiseActionTransaction(transaction);
 const authorization=authorizeFranchiseAction(verification,options.approved===true);
 const checks=Object.freeze({sameTeam:[franchise,roster,configuration,relationships,cap,leadership,ai].every(x=>x.teamId===String(teamId)),
  configurationValid:configuration.validation.valid,actionReady:action.readiness.ready,transactionVerified:verification.verified,
  humanGMFinalDecision:authorization.humanGMFinalDecision===true,noExecution:authorization.executionPerformed===false,
  noPersistence:[franchise,roster,configuration,relationships,cap,leadership,ai,action,transaction,authorization].every(x=>x.persistencePerformed===false),
  sourceUnchanged:JSON.stringify(state)===before});
 return Object.freeze({kind:'phase-6-integration-exit-gate',version:1,passed:Object.values(checks).every(Boolean),checks,
  boundaries:Object.freeze({phase7TradeExecutionIncluded:false,livePersistenceIncluded:false,automaticAIDecisionsIncluded:false})});
}
module.exports={createPhase6IntegrationExitGate};
