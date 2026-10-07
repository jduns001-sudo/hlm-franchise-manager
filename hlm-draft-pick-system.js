'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
function fail(c,m){const e=new Error(m);e.code=c;throw e;}
function valid(state){if(!validateGameStateEnvelope(state).valid)fail('INVALID_DRAFT_STATE','Valid GameState required.');}
function pickId(p){return p?.pickId??p?.id;}
function findPick(state,id){return state.assets.draftPicks.find(p=>String(pickId(p))===String(id));}
function createDraftPickOwnershipView(state,id){valid(state);const p=findPick(state,id);if(!p)fail('DRAFT_PICK_NOT_FOUND','DraftPick required.');
 const original=p.originalTeamId??null,current=p.currentOwnerId??null;
 return Object.freeze({kind:'draft-pick-ownership',version:1,pickId:String(pickId(p)),originalTeamId:original,currentOwnerId:current,
 originalOwnerImmutable:true,currentOwnerSelects:true,ownershipMutationPerformed:false,persistencePerformed:false});}
function createDraftLotteryContext(state,input={}){valid(state);return Object.freeze({kind:'draft-lottery-context',version:1,seasonId:input.seasonId??null,eligiblePickIds:Object.freeze([...(input.eligiblePickIds||[])].map(String)),
 lotteryDeterminesDraftOrder:true,odds:Object.freeze({...input.odds}),result:null,lotteryPerformed:false,persistencePerformed:false});}
function createDraftProtectionContext(state,id,input={}){valid(state);const p=findPick(state,id);if(!p)fail('DRAFT_PICK_NOT_FOUND','DraftPick required.');
 return Object.freeze({kind:'draft-protection-context',version:1,pickId:String(pickId(p)),storedProtection:p.protection??null,storedConditions:p.conditions??null,
 callerTerms:input.terms??null,canTransferOrRollover:true,resolutionPerformed:false,outcome:null,sourceStateMutated:false,persistencePerformed:false});}
function verifyDraftPickOwnership(state,id,teamId){const v=createDraftPickOwnershipView(state,id);return Object.freeze({kind:'draft-pick-ownership-verification',version:1,pickId:v.pickId,teamId,currentOwnerId:v.currentOwnerId,verified:String(v.currentOwnerId)===String(teamId)});}
module.exports={createDraftPickOwnershipView,createDraftLotteryContext,createDraftProtectionContext,verifyDraftPickOwnership};
