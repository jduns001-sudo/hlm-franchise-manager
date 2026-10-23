'use strict';
// Mission 1462: composite source-backed player + pick review, never settlement.
// This experimental module does not authenticate CPU decisions or write saves.
const {inspect:inspectPicks}=require('./hlm-phase11-draft-pick-trade-readiness');
function inspect(state,input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Explicit composite trade required');
 if(!Array.isArray(input.picks)||input.picks.length===0)throw Error('Combined trade requires draft picks');
 const reviewed=inspectPicks(state,input);
 if(reviewed.financialReviewed!==true||reviewed.restrictionsReviewed!==true)
  throw Error('Source-backed financial and roster checks incomplete');
 if(!Array.isArray(reviewed.picks)||reviewed.picks.length!==input.picks.length)
  throw Error('Draft rights review incomplete');
 const result={
  status:'integrated-player-pick-review-only',
  source:'current-isolated-universe',
  players:Object.freeze({outgoingPlayerId:String(input.outgoingPlayerId),incomingPlayerId:String(input.incomingPlayerId)}),
  picks:reviewed.picks,
  financialReviewed:true,restrictionsReviewed:true,
  gmApproved:false,independentlyAuthenticated:false,
  settlementAuthorized:false,saved:false,experimental:true
 };
 return Object.freeze(result);
}
function createSession(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
    typeof key!=='string'||!key||key==='hlm_front_office_v8')
  throw Error('Explicit isolated nonproduction storage required');
 let baseline=storage.getItem(key),pending=null;
 const blocked=code=>Object.freeze({status:'integrated-trade-blocked',code,saved:false,settlementAuthorized:false,experimental:true});
 function reload(){baseline=storage.getItem(key);pending=null;return baseline?JSON.parse(baseline):null}
 function review(input){
  pending=null;
  if(storage.getItem(key)!==baseline)return blocked('stale-review');
  if(!baseline)return blocked('missing-save');
  const result=inspect(JSON.parse(baseline),input);
  pending=JSON.stringify(input);
  return result;
 }
 function decide(action){
  if(!['approve','decline','cancel'].includes(action))throw Error('Explicit human GM decision required');
  if(!pending)return blocked('review-required');
  const proposal=pending;pending=null;
  if(storage.getItem(key)!==baseline)return blocked('stale-review');
  if(action!=='approve')return blocked(action);
  try{inspect(JSON.parse(baseline),JSON.parse(proposal))}
  catch{return blocked('review-invalidated')}
  return blocked('settlement-disabled');
 }
 return Object.freeze({review,decide,reload});
}
module.exports={inspect,createSession};
