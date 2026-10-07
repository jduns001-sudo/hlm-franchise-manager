'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createTradeExecutionPackage}=require('./hlm-trade-execution-gate');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function applyAssetMove(state,asset,toTeamId){
 if(asset.type==='player'||asset.type==='prospect'){const p=state.universe.players.find(x=>String(x.id)===asset.id);if(!p)fail('TRADE_EXECUTION_PLAYER_NOT_FOUND','Player asset not found.');p.teamId=toTeamId;return;}
 if(asset.type==='draft-pick'){const p=state.assets.draftPicks.find(x=>String(x.id??x.pickId)===asset.id);if(!p)fail('TRADE_EXECUTION_PICK_NOT_FOUND','Draft pick not found.');p.ownerTeamId=toTeamId;return;}
 fail('TRADE_EXECUTION_ASSET_NOT_ACTIVATED','Asset type is not activated for candidate movement.');
}
function createTradeExecutionCandidate(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_TRADE_EXECUTION_STATE','Valid GameState required.');
 const before=JSON.stringify(state);const gate=createTradeExecutionPackage(state,input);if(!gate.authorization.authorized)fail('TRADE_EXECUTION_NOT_AUTHORIZED','Trade must pass verification and human authorization.');
 const candidate=clone(state);
 for(const leg of gate.verification.candidate.legs)for(const asset of leg.assets)applyAssetMove(candidate,asset,leg.toTeamId);
 const validation=validateGameStateEnvelope(candidate);if(!validation.valid)fail('TRADE_EXECUTION_CANDIDATE_INVALID','Candidate GameState failed envelope validation.');
 return Object.freeze({kind:'trade-execution-candidate',version:1,gate,candidateState:candidate,
  verification:Object.freeze({candidateGameStateValid:true,sourceGameStateProtected:JSON.stringify(state)===before}),
  movedAssetTypes:Object.freeze(['player','prospect','draft-pick']),executionPerformedOnCandidate:true,liveGameStateMutated:false,persistencePerformed:false});
}
module.exports={createTradeExecutionCandidate};
