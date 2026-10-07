'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const SCOUT_EVALUATION_AREAS=Object.freeze(['current-ability','potential','regional-knowledge','league-knowledge','position-specialization']);
const REPORT_COMPONENTS=Object.freeze(['estimated-ability-range','estimated-potential','confidence','strengths','weaknesses','projection','notes']);
function fail(c,m){const e=new Error(m);e.code=c;throw e;}
function prospect(state,id){return (state.universe?.prospects||[]).find(p=>p.id===id)||(state.universe?.players||[]).find(p=>p.id===id);}
function createScoutProfile(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_SCOUTING_STATE','Valid GameState required.');
 if(!input.scoutId)fail('SCOUT_ID_REQUIRED','Scout ID required.');
 return Object.freeze({kind:'scout-profile',version:1,scoutId:input.scoutId,teamId:input.teamId??null,personality:input.personality??null,
  evaluations:Object.freeze({...input.evaluations}),specializations:Object.freeze({...input.specializations}),evaluationAreas:SCOUT_EVALUATION_AREAS});
}
function createScoutingReport(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_SCOUTING_STATE','Valid GameState required.');
 if(!prospect(state,input.prospectId))fail('PROSPECT_NOT_FOUND','Prospect not found.');
 if(!input.scoutId)fail('SCOUT_ID_REQUIRED','Scout ID required.');
 return Object.freeze({kind:'scouting-report',version:1,prospectId:input.prospectId,scoutId:input.scoutId,teamId:input.teamId??null,
  estimatedAbilityRange:Object.freeze({...input.estimatedAbilityRange}),estimatedPotential:input.estimatedPotential??null,confidence:input.confidence??null,
  strengths:Object.freeze([...(input.strengths||[])]),weaknesses:Object.freeze([...(input.weaknesses||[])]),projection:input.projection??null,notes:input.notes??null,
  components:REPORT_COMPONENTS,actualAbilityExposed:false,generatedFromFormula:false,persistencePerformed:false});
}
function compareScoutReports(reports=[]){
 const ids=new Set(reports.map(r=>r.scoutId));const prospects=new Set(reports.map(r=>r.prospectId));
 return Object.freeze({kind:'scout-report-comparison',version:1,reportCount:reports.length,scoutCount:ids.size,prospectCount:prospects.size,
  disagreementRetained:true,consensusForced:false,reports:Object.freeze([...reports])});
}
function createScoutingInformationContext(input={}){
 return Object.freeze({kind:'scouting-information-context',version:1,competitionLevel:input.competitionLevel??null,availableScoutingData:input.availableScoutingData??null,
  region:input.region??null,league:input.league??null,exposureAffectsInformationQuality:true,informationQuality:null,calculationPerformed:false});
}
module.exports={SCOUT_EVALUATION_AREAS,REPORT_COMPONENTS,createScoutProfile,createScoutingReport,compareScoutReports,createScoutingInformationContext};
