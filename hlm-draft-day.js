'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const CPU_DRAFT_FACTORS=Object.freeze(['needs','philosophy','scouting','personality','position','potential','development','risk']);
function fail(c,m){const e=new Error(m);e.code=c;throw e;}function valid(s){if(!validateGameStateEnvelope(s).valid)fail('INVALID_DRAFT_STATE','Valid GameState required.');}
function createDraftDayContext(state,input={}){valid(state);if(!input.currentPickId)fail('CURRENT_PICK_REQUIRED','Current pick required.');
 return Object.freeze({kind:'draft-day-context',version:1,currentPickId:String(input.currentPickId),availableProspectIds:Object.freeze([...(input.availableProspectIds||[])].map(String)),
 draftBoard:Object.freeze([...(input.draftBoard||[])]),tradeOffers:Object.freeze([...(input.tradeOffers||[])]),timeContext:input.timeContext??null,eventContext:input.eventContext??null,
 selectionPerformed:false,tradePerformed:false,persistencePerformed:false});}
function createCpuDraftEvaluation(state,input={}){valid(state);if(!input.teamId||!input.prospectId)fail('CPU_DRAFT_IDS_REQUIRED','Team and prospect required.');
 const factors={};for(const k of CPU_DRAFT_FACTORS)factors[k]=input.factors?.[k]??null;
 return Object.freeze({kind:'cpu-draft-evaluation',version:1,teamId:String(input.teamId),prospectId:String(input.prospectId),factors:Object.freeze(factors),
 highestOverallOnly:false,score:null,formulaApplied:false,selectionPerformed:false});}
function createDraftSelectionCandidate(state,input={}){valid(state);if(!input.pickId||!input.prospectId||!input.teamId)fail('DRAFT_SELECTION_REQUIRED','Pick, prospect and team required.');
 return Object.freeze({kind:'draft-selection-candidate',version:1,pickId:String(input.pickId),prospectId:String(input.prospectId),teamId:String(input.teamId),
 ownershipVerified:input.ownershipVerified===true,prospectAvailable:input.prospectAvailable===true,humanAuthorizationRequired:input.humanAuthorizationRequired!==false,
 ready:input.ownershipVerified===true&&input.prospectAvailable===true,executed:false,sourceStateMutated:false,persistencePerformed:false});}
module.exports={CPU_DRAFT_FACTORS,createDraftDayContext,createCpuDraftEvaluation,createDraftSelectionCandidate};
