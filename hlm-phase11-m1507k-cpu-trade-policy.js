'use strict';
/* Mission 1507K: deterministic CPU trade valuation ADVICE, not authority or consent.
 * No mutable storage, no settlement and no user-supplied override of source values.
 */
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
const {inspect}=require('./hlm-phase11-m1507i-trade-invariant-gate');
function evaluate(state,input){
 const deny=(code)=>Object.freeze({status:'cpu-trade-evaluation-blocked',code,
  recommendation:'manual-review',authenticatedCpuConsent:false,settlementAuthorized:false,saved:false,experimental:true});
 let preview;
 try{preview=propose(state,input)}catch{return deny('source-eligibility-failed')}
 if(inspect(state,input,preview.nextState).status!=='trade-proposal-invariants-verified')return deny('invariant-check-failed');
 const players=state.universe.players;
 const outgoing=players.find(p=>String(p.id)===String(input.outgoingPlayerId));
 const incoming=players.find(p=>String(p.id)===String(input.incomingPlayerId));
 // Existing numeric overall is the ONLY value signal; do not fabricate missing ratings.
 if(!Number.isInteger(outgoing?.overall)||!Number.isInteger(incoming?.overall)||
  outgoing.overall<0||outgoing.overall>100||incoming.overall<0||incoming.overall>100)
  return deny('source-backed-player-valuations-unavailable');
 const receivingGain=outgoing.overall-incoming.overall;
 const recommendation=receivingGain>0?'favorable-for-receiving-team':
  receivingGain<0?'unfavorable-for-receiving-team':'even-rating-exchange';
 return Object.freeze({status:'cpu-trade-evaluation-preview',recommendation,
  receivingTeamRatingDelta:receivingGain,source:'current-isolated-universe-overall',
  authenticatedCpuConsent:false,settlementAuthorized:false,saved:false,experimental:true,
  reason:'Overall-only scouting signal; independent CPU authority and settlement are unavailable'});
}
module.exports={evaluate};
