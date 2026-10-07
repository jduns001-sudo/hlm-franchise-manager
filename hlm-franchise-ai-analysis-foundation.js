'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createFranchiseManagementSnapshot}=require('./hlm-franchise-management-foundation');
const ANALYSIS_AREAS=Object.freeze(['roster','cap','prospects','organizational-needs']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function list(v){return Array.isArray(v)?v:[];}
function createFranchiseAIAnalysis(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_FRANCHISE_AI_GAME_STATE','Valid GameState required.');
 const franchise=createFranchiseManagementSnapshot(state,teamId);
 const supplied=options.analysis||{};
 const analysis={};
 for(const area of ANALYSIS_AREAS)analysis[area]=Object.freeze(list(supplied[area]).map(x=>Object.freeze({...x})));
 const priorities=Object.freeze(list(options.priorities).map(x=>Object.freeze({...x})));
 const recommendations=Object.freeze(list(options.recommendations).map(x=>Object.freeze({...x})));
 const lineSuggestions=Object.freeze(list(options.lineSuggestions).map(x=>Object.freeze({...x})));
 return Object.freeze({kind:'franchise-ai-analysis',version:1,teamId:String(teamId),areas:ANALYSIS_AREAS,
  facts:Object.freeze({rosterCount:franchise.roster.length,contractCount:franchise.contracts.length,draftPickCount:franchise.draftPicks.length,injuryCount:franchise.injuries.length}),
  analysis:Object.freeze(analysis),priorities,recommendations,
  lineSuggestions:Object.freeze({items:lineSuggestions,canRecommend:true,canExplainChemistryOrMatchups:true,silentLineupChangesAllowed:false}),
  authority:Object.freeze({humanGMFinalDecision:true,automaticRosterChanges:false,automaticTransactions:false}),
  generation:Object.freeze({analysisGeneratedByFormula:false,prioritiesGeneratedByFormula:false,recommendationsGeneratedByFormula:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={ANALYSIS_AREAS,createFranchiseAIAnalysis};
