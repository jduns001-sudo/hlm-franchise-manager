'use strict';
/* Mission 1520: atomic settlement preflight. No persistence, no consent forgery. */
const {prepareForHumanReview}=require('./hlm-phase11-m1519-cpu-authority-boundary');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const reject=code=>Object.freeze({ok:false,code,readyToSettle:false,saved:false,settlementAuthorized:false});
function inspect(state,input,options={}){
 if(options.experimentalEnabled!==true)return reject('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return reject('gm-cancelled-or-declined');
 if(options.gmApproved!==true)return reject('gm-approval-required');
 const result=prepareForHumanReview(state,input,options);
 if(!result.ok)return reject(result.code);
 const candidate=result.candidateState;
 if(validateGameStateEnvelope(candidate).valid!==true)return reject('invalid-candidate-envelope');
 const previous=state?.meta?.revision, next=candidate?.meta?.revision;
 if(!Number.isSafeInteger(previous)||next!==previous+1||result.expectedRevision!==previous)
  return reject('revision-invariant-failed');
 const players=candidate?.universe?.players,contracts=candidate?.assets?.contracts;
 if(!Array.isArray(players)||!Array.isArray(contracts))return reject('missing-source-records');
 const ids=[input?.outgoingPlayerId,input?.incomingPlayerId].map(String);
 if(ids[0]===ids[1])return reject('duplicate-player');
 for(const id of ids){
  const player=players.filter(p=>String(p.id)===id);
  const active=contracts.filter(c=>String(c.playerId)===id&&c.status==='active');
  if(player.length!==1||active.length!==1||String(player[0].teamId)!==String(active[0].teamId))
   return reject('ownership-contract-invariant-failed');
 }
 return Object.freeze({ok:true,code:'preflight-only-no-settlement',
  expectedRevision:previous,candidateRevision:next,
  cpuPolicyAccepted:true,gmReviewed:true,sourceOwnershipConsistent:true,
  cpuConsentAuthenticated:false,readyToSettle:false,saved:false,settlementAuthorized:false});
}
module.exports={inspect};
