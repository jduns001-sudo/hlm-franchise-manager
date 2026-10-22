'use strict';
/* Mission 1448: receiving-team authority and settlement-readiness PREVIEW only.
 * No trade settlement, save writes, or production activation. */
const {evaluate}=require('./hlm-phase11-isolated-trade-decision');
const {createTradeReview}=require('./hlm-phase11-gm-trade-review');
function inspect(state,input){
 const result=evaluate(state,input);
 const other=result.otherTeamId;
 const records=state.extensions.tradeDecisionConsents.filter(c=>c&&
  String(c.receivingTeamId)===other&&String(c.outgoingPlayerId)===String(input.outgoingPlayerId)&&
  String(c.incomingPlayerId)===String(input.incomingPlayerId));
 if(records.length!==1||records[0].decision!=='accepted'||records[0].source!=='receiving-team-authority')
  throw Error('Authoritative receiving-team decision required');
 const record=records[0];
 // Provenance is a declared saved-state claim, not independently authenticated.
 const provenance={source:record.source,receivingTeamId:other,
  independentlyAuthenticated:false};
 return Object.freeze({status:'review-ready-settlement-blocked',receivingTeamDecision:'accepted',
  receivingTeam:provenance,financialReviewed:result.financial.eligibleForFurtherReview,
  restrictionsReviewed:result.restrictions.eligibleForFurtherReview,
  humanGMSettlementApproval:false,atomicSettlementVerified:false,
  settlementAuthorized:false,saved:false,experimental:true,
  reason:'No authenticated CPU decision mechanism or atomic settlement transaction is integrated'});
}
function createReadinessSession(storage,key){
 const gm=createTradeReview(storage,key);
 let baseline=storage.getItem(key),pending=null;
 function reload(){const s=gm.reload();baseline=storage.getItem(key);pending=null;return s}
 function review(input){
  pending=null;
  if(storage.getItem(key)!==baseline)throw Error('Stale isolated review; reload');
  if(!baseline)throw Error('No isolated franchise');
  const readiness=inspect(JSON.parse(baseline),input);
  gm.review(input);pending={input:JSON.parse(JSON.stringify(input))};
  return readiness;
 }
 function decide(action){
  if(storage.getItem(key)!==baseline){pending=null;throw Error('Stale isolated review; reload')}
  if(!pending)throw Error('Review required');
  const reviewedInput=pending.input;
  const result=gm.decide(action);
  pending=null;
  if(action==='approve-review'){
   const current=inspect(JSON.parse(baseline),reviewedInput);
   return Object.freeze({...result,readiness:current});
  }
  return result;
 }
 return Object.freeze({review,decide,reload});
}
module.exports={inspect,createReadinessSession};
