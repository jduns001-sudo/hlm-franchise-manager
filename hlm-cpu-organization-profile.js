'use strict';
const {COMPETITIVE_STATES,createCPUOrganizationIntelligence}=require('./hlm-cpu-organization-intelligence');
const PROFILE_FIELDS=Object.freeze(['spendingPhilosophy','draftStrategy','prospectPreference','veteranPreference','developmentPhilosophy','ownerInfluence','marketContext']);
const GM_TENDENCIES=Object.freeze(['riskTolerance','analyticsUsage','tradeAggression','patience']);
function value(options,key){return options[key]??null;}
function createCPUOrganizationProfile(state,teamId,options={}){
 const intelligence=createCPUOrganizationIntelligence(state,teamId,{leadership:options.leadership||{},franchiseAnalysis:options.franchiseAnalysis||{},competitiveState:null,gmTraits:options.gmTraits||{}});
 const competitiveState=value(options,'competitiveState');
 const profile={};for(const key of PROFILE_FIELDS)profile[key]=value(options,key);
 const gm={};for(const key of GM_TENDENCIES)gm[key]=options.gmTraits?.[key]??null;
 return Object.freeze({kind:'cpu-organization-profile',version:1,teamId:intelligence.teamId,
  philosophy:intelligence.identity.philosophy,
  competitive:Object.freeze({state:competitiveState,valid:competitiveState===null||COMPETITIVE_STATES.includes(competitiveState),allowed:COMPETITIVE_STATES}),
  profile:Object.freeze(profile),gm:Object.freeze(gm),
  context:Object.freeze({analysis:intelligence.decisionModel.analysis,decisionAreas:intelligence.decisionModel.areas}),
  authority:Object.freeze({...intelligence.authority,cpuDecisionExecutionEnabled:false}),
  sourceStateMutated:intelligence.sourceStateMutated,persistencePerformed:false});
}
module.exports={COMPETITIVE_STATES,PROFILE_FIELDS,GM_TENDENCIES,createCPUOrganizationProfile};
