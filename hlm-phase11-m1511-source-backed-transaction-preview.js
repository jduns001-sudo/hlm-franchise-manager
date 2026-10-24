'use strict';
/* Mission 1511: real saved-GameState transaction preview, strictly read-only.
 * Never authenticates CPU consent or commits a player/contract transfer.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {review}=require('./hlm-phase11-guarded-player-trade');
const {evaluateTradeEligibility}=require('./hlm-phase11-trade-financial-eligibility');
const {evaluateTradeRestrictions}=require('./hlm-phase11-trade-restrictions');
function fail(code){return Object.freeze({ok:false,code,settlementAuthorized:false,saved:false,experimental:true})}
function inspect(state,input,options={}){
 if(options.cancelled===true||options.declined===true)return fail('gm-declined-or-cancelled');
 if(options.experimentalEnabled!==true)return fail('experiment-disabled');
 if(!state||validateGameStateEnvelope(state).valid!==true)return fail('invalid-source-state');
 const revision=state.meta?.revision;
 if(!Number.isSafeInteger(revision)||revision<0||options.expectedGameRevision!==revision)
  return fail('stale-or-missing-game-revision');
 const controlled=String(state.meta.controlledTeamId??'');
 const args={controlledTeamId:controlled,outgoingPlayerId:input?.outgoingPlayerId,incomingPlayerId:input?.incomingPlayerId};
 try{
  const proposal=review(state,input);
  const financial=evaluateTradeEligibility(state,args);
  const restrictions=evaluateTradeRestrictions(state,args);
  // Source claims of CPU consent are not independently authenticated.
  // No game-state mutation, no settlement approval, no authorization consumption.
  return Object.freeze({ok:true,code:'source-backed-preview-only',
   gameRevision:revision,controlledTeamId:controlled,
   otherTeamId:String(proposal.summary.otherTeamId),
   outgoingPlayerId:String(args.outgoingPlayerId),incomingPlayerId:String(args.incomingPlayerId),
   financial,restrictions,receivingTeamConsentAuthenticated:false,
   gmSettlementApproved:false,atomicSettlementVerified:false,
   settlementAuthorized:false,saved:false,experimental:true});
 }catch{return fail('source-validation-failed')}
}
module.exports={inspect};
