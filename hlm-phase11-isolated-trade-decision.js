'use strict';
/* Mission 1446: read-only, source-validated trade decision. Settlement intentionally disabled. */
const {review,createSession}=require('./hlm-phase11-guarded-player-trade');
const {evaluateTradeEligibility}=require('./hlm-phase11-trade-financial-eligibility');
const {evaluateTradeRestrictions}=require('./hlm-phase11-trade-restrictions');
function evaluate(state,input){
 const proposal=review(state,input);
 const controlledTeamId=state.meta.controlledTeamId;
 const args={outgoingPlayerId:input?.outgoingPlayerId,incomingPlayerId:input?.incomingPlayerId,controlledTeamId};
 const financial=evaluateTradeEligibility(state,args);
 const restrictions=evaluateTradeRestrictions(state,args);
 const other=String(proposal.summary.otherTeamId);
 // Consent must be a unique saved record for the precise trade and receiving team.
 const records=state.extensions?.tradeDecisionConsents;
 if(!Array.isArray(records))throw Error('Source-backed receiving-team consent unavailable');
 const matches=records.filter(c=>c&&String(c.receivingTeamId)===other&&
   String(c.outgoingPlayerId)===String(args.outgoingPlayerId)&&
   String(c.incomingPlayerId)===String(args.incomingPlayerId));
 if(matches.length!==1||matches[0].decision!=='accepted'||matches[0].source!=='receiving-team-authority')
  throw Error('Explicit authoritative receiving-team consent required');
 return Object.freeze({eligibleForFurtherReview:true,settlementAuthorized:false,
  experimental:true,source:'current-isolated-universe',controlledTeamId:String(controlledTeamId),
  otherTeamId:other,financial,restrictions,consentVerified:true,
  reason:'Human GM approval and atomic settlement integration are not authorized'});
}
function createDecisionSession(storage,key){
 const guarded=createSession(storage,key);
 return Object.freeze({
  reload:()=>guarded.reload(),
  propose(input){
   // Read the same isolated key through guarded session, then source-validate.
   const summary=guarded.propose(input);
   const raw=storage.getItem(key);
   if(!raw)throw Error('No isolated franchise');
   try{return evaluate(JSON.parse(raw),input)}
   catch(e){guarded.reload();throw e}
  },
  approve(approved){return guarded.approve(approved)}
 });
}
module.exports={evaluate,createDecisionSession};
