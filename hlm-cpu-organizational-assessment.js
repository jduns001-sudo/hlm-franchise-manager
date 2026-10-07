'use strict';
const {createCPUOrganizationProfile}=require('./hlm-cpu-organization-profile');
const ASSESSMENT_FACTORS=Object.freeze(['rosterDepth','injuries','contracts','cap','prospects','draftPicks','teamNeeds','performance','playerValue','personality','chemistry','ownerGoals','competitiveWindow']);
function list(v){return Object.freeze((Array.isArray(v)?v:[]).map(x=>Object.freeze({...x})));}
function createCPUOrganizationalAssessment(state,teamId,options={}){
 const profile=createCPUOrganizationProfile(state,teamId,options.profile||{});
 const facts=profile.context.analysis.facts;
 const supplied=options.context||{};
 const context={};
 for(const factor of ASSESSMENT_FACTORS)context[factor]=list(supplied[factor]);
 return Object.freeze({kind:'cpu-organizational-assessment',version:1,teamId:profile.teamId,
  competitive:Object.freeze({state:profile.competitive.state,valid:profile.competitive.valid}),
  identity:Object.freeze({philosophy:profile.philosophy,profile:profile.profile,gm:profile.gm}),
  facts:Object.freeze({rosterCount:facts.rosterCount,contractCount:facts.contractCount,draftPickCount:facts.draftPickCount,injuryCount:facts.injuryCount}),
  factors:ASSESSMENT_FACTORS,context:Object.freeze(context),
  decisionStage:Object.freeze({stage:'assess',identifyProblemsPerformed:false,evaluateOptionsPerformed:false,prioritizePerformed:false,actPerformed:false}),
  authority:Object.freeze({...profile.authority,cpuDecisionExecutionEnabled:false,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:profile.sourceStateMutated,persistencePerformed:false});
}
module.exports={ASSESSMENT_FACTORS,createCPUOrganizationalAssessment};
