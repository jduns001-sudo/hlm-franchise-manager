'use strict';
// Isolated, source-backed GM transaction review. No CPU authentication or settlement.
const {createWorkspace}=require('./hlm-phase11-integrated-trade-workspace');
function createGuardedTransaction(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof key!=='string'||!key||key==='hlm_front_office_v8')throw Error('Explicit isolated storage required');
 const workspace=createWorkspace(storage,key);
 let pending=false,baseline=null,sequence=0;
 const blocked=code=>Object.freeze({status:'blocked',code,saved:false,settlementAuthorized:false,independentlyAuthenticated:false,experimental:true});
 function clear(){pending=false;baseline=null;sequence++}
 function review(proposal){
  clear();const raw=storage.getItem(key);if(typeof raw!=='string'||!raw)return blocked('missing-isolated-save');
  let result;try{result=workspace.review(proposal)}catch{return blocked('source-validation-failed')}
  if(!result||result.status!=='review-only'||result.financialReviewed!==true||result.restrictionsReviewed!==true||result.saved!==false||result.settlementAuthorized!==false||result.independentlyAuthenticated!==false)return blocked('source-review-blocked');
  if(storage.getItem(key)!==raw)return blocked('stale-review');
  pending=true;baseline=raw;return Object.freeze({...result,reviewSequence:sequence,gmDecisionRequired:true});
 }
 function decide(action,expectedSequence){
  if(!['approve','decline','cancel'].includes(action))return blocked('unsupported-decision');
  if(!pending||expectedSequence!==sequence)return blocked('stale-or-replayed-decision');
  const stale=storage.getItem(key)!==baseline;clear();if(stale)return blocked('stale-review');
  let result;try{result=workspace.decide(action)}catch{return blocked('decision-rejected')}
  if(!result||result.saved!==false||result.settlementAuthorized!==false)return blocked('unsafe-decision-result');
  return blocked(action==='approve'?'settlement-disabled':action);
 }
 function reload(){clear();workspace.reload();return blocked('review-cleared')}
 return Object.freeze({review,decide,reload});
}
module.exports={createGuardedTransaction};
