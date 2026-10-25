'use strict';
// Experimental isolated settlement adapter. Requires an independently supplied, audited
// receiving-team authority and atomic compare-and-swap store; never accesses production.
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {evaluateTradeEligibility}=require('./hlm-phase11-trade-financial-eligibility');
const {evaluateTradeRestrictions}=require('./hlm-phase11-trade-restrictions');
const PRODUCTION='hlm_front_office_v8';
const copy=x=>JSON.parse(JSON.stringify(x));
function createSettlement(store,key,authority){
 if(!key||key===PRODUCTION||typeof store?.getItem!=='function'||typeof store?.compareAndSwap!=='function')
  throw Error('Explicit isolated atomic store required');
 if(!authority||typeof authority.verify!=='function')throw Error('Independently audited receiving-team authority required');
 let pending=null;
 const blocked=code=>Object.freeze({status:'blocked',code,saved:false,experimental:true});
 function validate(state,input){
  if(!validateGameStateEnvelope(state).valid)throw Error('Invalid GameState');
  if(!input||String(input.outgoingPlayerId||'')===String(input.incomingPlayerId||''))throw Error('Distinct players required');
  const ids={outgoingPlayerId:input.outgoingPlayerId,incomingPlayerId:input.incomingPlayerId,controlledTeamId:state.meta.controlledTeamId};
  const f=evaluateTradeEligibility(state,ids),r=evaluateTradeRestrictions(state,ids);
  if(!f.eligibleForFurtherReview||!r.eligibleForFurtherReview||f.otherTeamId!==r.otherTeamId)throw Error('Eligibility mismatch');
  const a=state.universe.players.filter(p=>String(p.id)===String(ids.outgoingPlayerId));
  const b=state.universe.players.filter(p=>String(p.id)===String(ids.incomingPlayerId));
  const ac=state.assets.contracts.filter(c=>String(c.playerId)===String(ids.outgoingPlayerId)&&c.status==='active');
  const bc=state.assets.contracts.filter(c=>String(c.playerId)===String(ids.incomingPlayerId)&&c.status==='active');
  if(a.length!==1||b.length!==1||ac.length!==1||bc.length!==1)throw Error('Ambiguous source assets');
  const src=String(a[0].teamId),dest=String(b[0].teamId);
  return {ids,src,dest,projectedPayroll:f.projectedPayroll};
 }
 function review(input,proof){
  pending=null;
  const raw=store.getItem(key);if(typeof raw!=='string'||!raw)return blocked('missing-save');
  let state,v;try{state=JSON.parse(raw);v=validate(state,input)}catch{return blocked('source-validation-failed')}
  const request=Object.freeze({saveId:state.meta.saveId,controlledTeamId:v.src,receivingTeamId:v.dest,outgoingPlayerId:String(v.ids.outgoingPlayerId),incomingPlayerId:String(v.ids.incomingPlayerId),revision:state.meta.tradeRevision??0});
  // Consent proof is never accepted from saved extensions, caller flags or a claim alone.
  let accepted=false;try{accepted=authority.verify(request,proof)===true}catch{return blocked('receiving-authority-error')}
  if(!accepted)return blocked('receiving-authority-unverified');
  if(store.getItem(key)!==raw)return blocked('stale-review');
  pending={raw,request,input:copy(input),proof};
  return Object.freeze({status:'awaiting-explicit-gm-approval',request,projectedPayroll:v.projectedPayroll,saved:false,experimental:true});
 }
 function decide(action){
  if(!['approve','decline','cancel'].includes(action))throw Error('Explicit GM decision required');
  if(!pending)return blocked('review-required');
  const p=pending;pending=null;
  if(action!=='approve')return blocked(action);
  if(store.getItem(key)!==p.raw)return blocked('stale-review');
  let state,v;try{state=JSON.parse(p.raw);v=validate(state,p.input)}catch{return blocked('revalidation-failed')}
  let accepted=false;try{accepted=authority.verify(p.request,p.proof)===true}catch{return blocked('receiving-authority-error')}
  if(!accepted)return blocked('receiving-authority-unverified');
  const next=copy(state),a=next.universe.players.find(q=>String(q.id)===String(p.input.outgoingPlayerId)),b=next.universe.players.find(q=>String(q.id)===String(p.input.incomingPlayerId));
  const ac=next.assets.contracts.find(c=>String(c.playerId)===String(a.id)&&c.status==='active'),bc=next.assets.contracts.find(c=>String(c.playerId)===String(b.id)&&c.status==='active');
  a.teamId=b.teamId; b.teamId=ac.teamId;ac.teamId=bc.teamId;bc.teamId=b.teamId;
  // Record a unique transaction in both current activity and permanent history.
  const revision=(state.meta.tradeRevision??0)+1;
  if(!Number.isSafeInteger(revision)||revision<1)return blocked('invalid-revision');
  const txId=String(state.meta.saveId||'isolated')+':trade:'+revision;
  if(next.activity.transactions.some(t=>t.id===txId)||next.history.records.some(t=>t.id===txId))return blocked('duplicate-history');
  const event={id:txId,type:'player-trade',outgoingPlayerId:String(a.id),incomingPlayerId:String(b.id),fromTeamId:v.src,toTeamId:v.dest,revision,experimental:true};
  next.activity.transactions.push(copy(event));next.history.records.push(copy(event));next.meta.tradeRevision=revision;
  if(!validateGameStateEnvelope(next).valid)return blocked('invalid-result');
  const committed=store.compareAndSwap(key,p.raw,JSON.stringify(next));
  if(committed!==true)return blocked('stale-or-rejected-atomic-write');
  return Object.freeze({status:'settled-isolated',transactionId:txId,saved:true,experimental:true,productionActivated:false});
 }
 function reload(){pending=null;const raw=store.getItem(key);return raw?copy(JSON.parse(raw)):null}
 return Object.freeze({review,decide,reload});
}
module.exports={createSettlement};
