'use strict';
const {createTradeEngineFoundation}=require('./hlm-trade-engine-foundation');
const {createTeamTradeContext,createContextualPlayerTradeValueInputs}=require('./hlm-trade-value-context');
const {createNegotiationContext}=require('./hlm-trade-negotiation-memory');
const {createTradeExecutionCandidate}=require('./hlm-trade-execution-candidate');
const {createTradeDeadlineContext}=require('./hlm-trade-deadline-ecosystem');
const {createPostTradeConsequences}=require('./hlm-post-trade-history');
function runPhase7IntegrationGate(state,input={}){
 const before=JSON.stringify(state);const teamIds=input.teamIds||[];const primary=teamIds[0],other=teamIds[1];
 const foundation=createTradeEngineFoundation(state,{teamId:primary});
 const teamContext=createTeamTradeContext(state,primary,input.teamContext||{});
 const playerValue=input.playerId?createContextualPlayerTradeValueInputs(state,input.playerId,teamContext,input.playerValue||{}):null;
 const negotiation=other?createNegotiationContext(state,{teamAId:primary,teamBId:other,teamA:input.teamA||{},teamB:input.teamB||{}}):null;
 const execution=input.execution?createTradeExecutionCandidate(state,input.execution):null;
 const deadline=createTradeDeadlineContext(state,primary,input.deadline||{});
 const consequences=createPostTradeConsequences(state,input.postTrade||{});
 const checks=Object.freeze({foundationReady:!!foundation,teamContextReady:!!teamContext,playerValueContextReady:!input.playerId||!!playerValue,
  negotiationReady:teamIds.length<2||!!negotiation,executionCandidateReady:!input.execution||!!execution,deadlineReady:!!deadline,postTradeReady:!!consequences,
  humanGMFinalAuthority:!execution||execution.gate.authorization.humanGMFinalAuthority===true,sourceGameStateProtected:JSON.stringify(state)===before,
  liveMutationDisabled:!execution||execution.liveGameStateMutated===false,persistenceDisabled:!execution||execution.persistencePerformed===false});
 const blockers=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
 return Object.freeze({kind:'phase7-integration-exit-gate',version:1,passed:blockers.length===0,blockers:Object.freeze(blockers),checks,
  scope:Object.freeze({phase:7,name:'Transactions & Trade Engine',foundationComplete: blockers.length===0,fullFinalFeatureImplementation:false,liveTradePersistenceActivated:false}),
  deferred:Object.freeze(['numeric-trade-valuation-model','autonomous-offer-and-counteroffer-generation','league-specific-protection-cap-and-retention-rules','conditional-pick-and-pick-swap-resolution','salary-and-future-asset-candidate-mutation','live-trade-persistence','automatic-post-trade-consequence-application','retrospective-outcome-analysis']),
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={runPhase7IntegrationGate};
