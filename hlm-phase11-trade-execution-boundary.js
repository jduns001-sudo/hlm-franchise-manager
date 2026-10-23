'use strict';
/* Mission 1453: experimental orchestration boundary. No settlement or production writes.
   No trusted CPU authority or atomic settlement adapter exists yet. */
const {evaluate}=require('./hlm-phase11-trade-decision-readiness-gate');
function createTradeExecutionBoundary(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof key!=='string'||!key||key==='hlm_front_office_v8')
  throw Error('Explicit isolated franchise storage required');
 let baseline=storage.getItem(key),pending=null;
 const blocked=(code)=>Object.freeze({status:'trade-execution-blocked',code,saved:false,settlementAuthorized:false,experimental:true});
 function reload(){baseline=storage.getItem(key);pending=null;return baseline?JSON.parse(baseline):null}
 function review(input,revision,declaration){
  pending=null;
  if(storage.getItem(key)!==baseline)return blocked('stale-review');
  if(!baseline)return blocked('missing-isolated-save');
  let state;try{state=JSON.parse(baseline)}catch{return blocked('invalid-save')}
  // Caller flags are not authority; read-only gate cannot authenticate CPU.
  const readiness=evaluate(state,input,revision,declaration,{gmApproved:false});
  if(!readiness.proposalDigest)return blocked('invalid-proposal');
  pending={input:JSON.parse(JSON.stringify(input)),revision,declaration:JSON.parse(JSON.stringify(declaration??null)),digest:readiness.proposalDigest};
  return Object.freeze({status:'awaiting-explicit-GM-decision',proposalDigest:pending.digest,saved:false,settlementAuthorized:false,experimental:true});
 }
 function decide(action){
  if(action!=='approve'&&action!=='decline'&&action!=='cancel')throw Error('Explicit GM decision required');
  if(!pending)return blocked('review-required');
  const p=pending;pending=null;
  if(storage.getItem(key)!==baseline)return blocked('stale-review');
  if(action!=='approve')return blocked(action);
  let state;try{state=JSON.parse(baseline)}catch{return blocked('invalid-save')}
  const readiness=evaluate(state,p.input,p.revision,p.declaration,{gmApproved:true});
  if(readiness.proposalDigest!==p.digest)return blocked('proposal-changed');
  // The current evaluator always fails closed. Never call storage.setItem.
  return blocked(readiness.code||'trusted-settlement-unavailable');
 }
 return Object.freeze({review,decide,reload});
}
module.exports={createTradeExecutionBoundary};
