'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createMultiTeamTradeCandidate}=require('./hlm-multi-team-trade');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function verifyTradeCandidate(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_TRADE_VERIFICATION_STATE','Valid GameState required.');
 const candidate=input.kind==='multi-team-trade-candidate'?input:createMultiTeamTradeCandidate(state,input);
 const blockers=[];
 if(candidate.teamIds.length<2)blockers.push('insufficient-participants');
 if(!candidate.legs.length)blockers.push('no-trade-legs');
 if(candidate.legs.some(l=>!l.assets.length))blockers.push('empty-trade-leg');
 return Object.freeze({kind:'trade-candidate-verification',version:1,candidate,verified:blockers.length===0,blockers:Object.freeze(blockers),
  playerProtectionVerified:input.playerProtectionVerified===true,leagueRulesVerified:input.leagueRulesVerified===true,
  capRulesVerified:input.capRulesVerified===true,sourceStateMutated:false,persistencePerformed:false});
}
function authorizeTradeCandidate(verification,input={}){
 if(!verification||verification.kind!=='trade-candidate-verification')fail('TRADE_VERIFICATION_REQUIRED','Trade verification required.');
 const humanApproved=input.humanGMApproved===true;
 const blockers=[...verification.blockers];
 if(!verification.playerProtectionVerified)blockers.push('player-protection-unverified');
 if(!verification.leagueRulesVerified)blockers.push('league-rules-unverified');
 if(!verification.capRulesVerified)blockers.push('cap-rules-unverified');
 if(!humanApproved)blockers.push('human-gm-approval-required');
 const authorized=verification.verified&&blockers.length===0;
 return Object.freeze({kind:'trade-human-authorization',version:1,authorized,humanGMFinalAuthority:true,humanGMApproved:humanApproved,
  blockers:Object.freeze(blockers),execution:Object.freeze({ready:authorized,performed:false}),gameStateMutated:false,persistencePerformed:false});
}
function createTradeExecutionPackage(state,input={}){
 const verification=verifyTradeCandidate(state,input);const authorization=authorizeTradeCandidate(verification,input);
 return Object.freeze({kind:'trade-execution-package',version:1,verification,authorization,candidateState:null,
  executionPerformed:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={verifyTradeCandidate,authorizeTradeCandidate,createTradeExecutionPackage};
