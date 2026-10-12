'use strict';
// Phase 9 milestone evidence: distinguish tested isolated workflows from production-ready CPU play.
const {assessPhase9Readiness}=require('./hlm-phase9-integration-readiness');
const {createLeaguewideCPUDecisionReview}=require('./hlm-phase9-leaguewide-cpu-decision-review');
const {serializeGameState}=require('./hlm-game-state-serialization');
function assessIntegratedPhase9Readiness(state,teamId,options={}){
 const before=serializeGameState(state);
 const baseline=assessPhase9Readiness(state,teamId,options);
 const league=createLeaguewideCPUDecisionReview(state,{decisionOptionsByTeam:options.decisionOptionsByTeam||{}});
 const checks=Object.freeze({
  organizationAssessment:baseline.checks.organizationAssessment,
  decisionRecommendation:baseline.checks.decisionRecommendation,
  humanApprovalBoundary:baseline.checks.humanApprovalBoundary,
  leaguewideReview:league.teamCount===state.universe.teams.length-1&&league.advisoryOnly===true,
  isolatedBrowserPersistenceIntegration:true,
  isolatedReviewedCPUTradeIntegration:true,
  verifiedDateOnlySimulationIntegration:true,
  automaticGameProcessing:false,
  automaticCPUDecisionExecution:false,
  activeFranchisePersistenceCutover:false,
  multiSeasonProductionContinuity:false,
  liveFrontOfficeIntegration:false,
  sourceUnchanged:serializeGameState(state)===before
 });
 // These flags describe modules present in the repository, not execution or production verification.
 const evidence=Object.freeze({
  isolatedBrowserPersistenceIntegration:'hlm-phase9-cpu-simulation-review-browser-save.test.js',
  isolatedReviewedCPUTradeIntegration:'hlm-phase9-cpu-simulation-trade-handoff.test.js',
  verifiedDateOnlySimulationIntegration:'hlm-phase9-cpu-simulation-cycle-review.test.js'
 });
 const blockers=Object.freeze(['automaticGameProcessing','automaticCPUDecisionExecution',
  'activeFranchisePersistenceCutover','multiSeasonProductionContinuity','liveFrontOfficeIntegration']
  .filter(key=>checks[key]!==true));
 return Object.freeze({kind:'phase9-integrated-readiness-evidence',version:1,baseline,
  leaguewideCPUCount:league.teamCount,checks,evidence,blockers,
  readyForPhase10:false,productionCPUExecutionEnabled:false,advisoryOnly:true,
  sourceStateMutated:serializeGameState(state)!==before});
}
module.exports={assessIntegratedPhase9Readiness};
