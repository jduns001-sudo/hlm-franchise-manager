'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createOrganizationLeadershipSnapshot}=require('./hlm-organization-leadership-foundation');
const {createFranchiseAIAnalysis}=require('./hlm-franchise-ai-analysis-foundation');
const COMPETITIVE_STATES=Object.freeze(['Contender','Playoff','Bubble','Transition','Rebuild']);
const DECISION_AREAS=Object.freeze(['roster','lines','contracts','trades','draft','free-agency','prospects','cap']);
const GM_TRAITS=Object.freeze(['riskTolerance','tradeAggression','draftPreference','freeAgencyPreference','prospectPatience','veteranPreference','analyticsUsage','adaptability']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createCPUOrganizationIntelligence(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_PHASE9_GAME_STATE','Valid GameState required.');
 const id=String(teamId??'').trim();if(!id)fail('CPU_ORGANIZATION_TEAM_REQUIRED','Permanent team ID required.');
 const before=JSON.stringify(state);
 const leadership=createOrganizationLeadershipSnapshot(state,id,options.leadership||{});
 const analysisBase=createFranchiseAIAnalysis(state,id,options.franchiseAnalysis||{});
 const canonicalDraftPickCount=state.assets.draftPicks.filter(p=>String(p.currentOwnerId??p.ownerTeamId??p.teamId??'')===id).length;
 const analysis=Object.freeze({...analysisBase,facts:Object.freeze({...analysisBase.facts,draftPickCount:canonicalDraftPickCount})});
 const competitiveState=options.competitiveState??null;
 const traits={};for(const key of GM_TRAITS)traits[key]=options.gmTraits?.[key]??null;
 const priorities=Object.freeze((Array.isArray(options.priorities)?options.priorities:[]).map(x=>Object.freeze({...x})));
 const memory=Object.freeze((Array.isArray(options.organizationalMemory)?options.organizationalMemory:[]).map(x=>Object.freeze({...x})));
 return Object.freeze({kind:'cpu-organization-intelligence',version:1,teamId:id,
  identity:Object.freeze({philosophy:leadership.philosophy.value,competitiveState,competitiveStateValid:competitiveState===null||COMPETITIVE_STATES.includes(competitiveState),gmTraits:Object.freeze(traits)}),
  decisionModel:Object.freeze({areas:DECISION_AREAS,cycle:Object.freeze(['assess','identify-problems','evaluate-options','prioritize','act','observe-results','update-beliefs','plan-again']),priorities,analysis}),
  organizationalMemory:Object.freeze({records:memory,appendOnlyRequired:true,persistencePerformed:false}),
  authority:Object.freeze({cpuDecisionExecutionEnabled:false,automaticTransactions:false,automaticRosterChanges:false,automaticContractActions:false,automaticDraftActions:false}),
  sourceStateMutated:JSON.stringify(state)!==before,persistencePerformed:false});
}
module.exports={COMPETITIVE_STATES,DECISION_AREAS,GM_TRAITS,createCPUOrganizationIntelligence};
