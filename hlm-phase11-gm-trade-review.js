'use strict';
/* Mission 1447: isolated, read-only GM trade review. No settlement or production access. */
const {evaluate}=require('./hlm-phase11-isolated-trade-decision');
const {createSession}=require('./hlm-phase11-guarded-player-trade');
function createTradeReview(storage,key){
 const guarded=createSession(storage,key);
 let baseline=storage.getItem(key),pending=null;
 const unchanged=()=>{if(storage.getItem(key)!==baseline){pending=null;throw Error('Stale isolated trade review; reload')}};
 const reload=()=>{const s=guarded.reload();baseline=storage.getItem(key);pending=null;return s};
 function review(input){
  pending=null;unchanged();
  if(!baseline)throw Error('No isolated franchise');
  const state=JSON.parse(baseline),result=evaluate(state,input);
  guarded.propose(input);
  pending={input:JSON.parse(JSON.stringify(input)),receivingTeamId:result.otherTeamId};
  return Object.freeze({status:'awaiting-human-GM-review',decision:result,settlementAuthorized:false});
 }
 function decide(action){
  if(action!=='approve-review'&&action!=='decline'&&action!=='cancel')throw Error('Explicit GM review decision required');
  unchanged();
  if(!pending)throw Error('Trade review required');
  if(action==='decline'||action==='cancel'){
   pending=null;return Object.freeze({status:action==='decline'?'declined':'cancelled',saved:false,settlementAuthorized:false});
  }
  const checked=evaluate(JSON.parse(baseline),pending.input);
  if(String(checked.otherTeamId)!==pending.receivingTeamId)throw Error('Receiving team changed');
  pending=null;
  return Object.freeze({status:'GM-review-approved',receivingTeamConsentVerified:true,
   saved:false,settlementAuthorized:false,reason:'Atomic trade settlement remains disabled'});
 }
 return Object.freeze({review,decide,reload});
}
module.exports={createTradeReview};
