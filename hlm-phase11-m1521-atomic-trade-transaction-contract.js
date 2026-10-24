'use strict';
/* Mission 1521: read-only transaction contract linking source preflight to the
 * atomic store's revision/event requirements. This is NOT trade settlement.
 * The CPU decision remains an advisory; no consent or persistence is granted.
 */
const {inspect}=require('./hlm-phase11-m1520-settlement-preflight');
const {prepareForHumanReview}=require('./hlm-phase11-m1519-cpu-authority-boundary');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
function prepareTransaction(state,input,options={}){
 const gate=inspect(state,input,options);
 if(!gate.ok)return deny(gate.code);
 const eventId=options.eventId;
 if(typeof eventId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(eventId))
  return deny('invalid-event-id');
 const review=prepareForHumanReview(state,input,options);
 if(!review.ok)return deny(review.code);
 const candidate=review.candidateState;
 if(validateGameStateEnvelope(candidate).valid!==true)return deny('invalid-candidate');
 if(candidate.meta.revision!==gate.candidateRevision||
    review.expectedRevision!==gate.expectedRevision)return deny('revision-changed');
 const players=candidate.universe.players,contracts=candidate.assets.contracts;
 for(const id of [input.outgoingPlayerId,input.incomingPlayerId]){
  const player=players.filter(p=>String(p.id)===String(id));
  const active=contracts.filter(c=>String(c.playerId)===String(id)&&c.status==='active');
  if(player.length!==1||active.length!==1||String(player[0].teamId)!==String(active[0].teamId))
   return deny('player-contract-mismatch');
 }
 return Object.freeze({ok:true,code:'transaction-contract-only',
  eventId,expectedRevision:gate.expectedRevision,
  candidateState:candidate,cpuConsentAuthenticated:false,
  saved:false,settlementAuthorized:false,atomicCommitAllowed:false});
}
async function commitTrade(){return deny('cpu-consent-and-real-settlement-unavailable')}
module.exports={prepareTransaction,commitTrade};
