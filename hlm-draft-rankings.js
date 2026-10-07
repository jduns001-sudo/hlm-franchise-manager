'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const RANKING_TYPES=Object.freeze(['league-media','organizational','ai-evaluation','user-draft-board']);
const DRAFT_BOARD_TAGS=Object.freeze(['Target','Untouchable','Rising','Falling','Need More Scouting']);
function valid(state){if(!validateGameStateEnvelope(state).valid){const e=new Error('Valid GameState required.');e.code='INVALID_DRAFT_STATE';throw e;}}
function createProspectRanking(state,input={}){valid(state);if(!RANKING_TYPES.includes(input.type)){const e=new Error('Supported ranking type required.');e.code='INVALID_RANKING_TYPE';throw e;}return Object.freeze({kind:'prospect-ranking',version:1,type:input.type,teamId:input.teamId??null,entries:Object.freeze([...(input.entries||[])]),rankingFormulaApplied:false,actualAbilityExposed:false,persistencePerformed:false});}
function createDraftBoardEntry(state,input={}){valid(state);if(!input.prospectId){const e=new Error('Prospect ID required.');e.code='PROSPECT_ID_REQUIRED';throw e;}const tags=Object.freeze([...(input.tags||[])]);return Object.freeze({kind:'draft-board-entry',version:1,prospectId:input.prospectId,teamId:input.teamId??null,tier:input.tier??null,tags,notes:input.notes??null,rank:input.rank??null,persistencePerformed:false});}
function compareRankings(rankings=[]){return Object.freeze({kind:'ranking-comparison',version:1,rankingCount:rankings.length,types:Object.freeze(rankings.map(r=>r.type)),differencesPreserved:true,consensusForced:false,rankings:Object.freeze([...rankings])});}
module.exports={RANKING_TYPES,DRAFT_BOARD_TAGS,createProspectRanking,createDraftBoardEntry,compareRankings};
