'use strict';
// Mission 1461: source-backed draft-pick trade preview only.
// No production storage, ownership mutation, CPU authentication, or settlement.
const {evaluate}=require('./hlm-phase11-isolated-trade-decision');
function pickKey(p){return [String(p.year),String(p.round),String(p.originalTeamId)].join(':')}
function inspect(state,input){
 if(!state||!Array.isArray(state.assets?.draftPicks)||!Array.isArray(state.universe?.teams))throw Error('Source-backed draft picks and teams required');
 if(!input||!Array.isArray(input.picks)||input.picks.length===0)throw Error('Explicit pick proposal required');
 const controlled=String(state.meta?.controlledTeamId??'');
 if(!controlled||!state.universe.teams.some(t=>String(t.id)===controlled))throw Error('Controlled team missing');
 // Existing player, cap, contract, roster and claimed receiving-team review must pass first.
 const base=evaluate(state,input);
 const other=String(base.otherTeamId);
 const seenIds=new Set(),seenNatural=new Set();
 const records=[];
 for(const transfer of input.picks){
  if(!transfer||typeof transfer!=='object'||Array.isArray(transfer))throw Error('Invalid pick transfer');
  const id=String(transfer.pickId??''),from=String(transfer.fromTeamId??''),to=String(transfer.toTeamId??'');
  if(!id||!from||!to||from===to||!([controlled,other].includes(from)&&[controlled,other].includes(to)))
   throw Error('Invalid pick transfer teams or ID');
  if(seenIds.has(id))throw Error('Duplicate pick in proposal');
  seenIds.add(id);
  const matches=state.assets.draftPicks.filter(p=>String(p.id)===id);
  if(matches.length!==1)throw Error('Pick missing or ambiguous in current universe');
  const p=matches[0];
  if(!Number.isInteger(p.year)||p.year<2000||!Number.isInteger(p.round)||p.round<1||p.round>20)
   throw Error('Invalid pick year or round');
  if(p.originalTeamId===undefined||p.originalTeamId===null)throw Error('Original team rights missing');
  const natural=pickKey(p);
  if(seenNatural.has(natural))throw Error('Duplicate underlying draft right in proposal');
  seenNatural.add(natural);
  if(state.assets.draftPicks.filter(x=>pickKey(x)===natural).length!==1)
   throw Error('Ambiguous draft rights in source universe');
  if(String(p.teamId)!==from)throw Error('Pick ownership does not match current source');
  if(!state.universe.teams.some(t=>String(t.id)===String(p.originalTeamId)))
   throw Error('Original pick team missing');
  records.push(Object.freeze({pickId:id,year:p.year,round:p.round,originalTeamId:String(p.originalTeamId),currentOwner:from,proposedOwner:to}));
 }
 return Object.freeze({status:'draft-pick-trade-review-only',source:'current-isolated-universe',picks:Object.freeze(records),financialReviewed:base.financial.eligibleForFurtherReview,restrictionsReviewed:base.restrictions.eligibleForFurtherReview,gmApproved:false,independentlyAuthenticated:false,settlementAuthorized:false,saved:false,experimental:true});
}
function createSession(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof key!=='string'||!key||key==='hlm_front_office_v8')throw Error('Explicit isolated storage required');
 let baseline=storage.getItem(key),pending=null;
 const deny=code=>Object.freeze({status:'draft-pick-trade-blocked',code,saved:false,settlementAuthorized:false,experimental:true});
 function reload(){baseline=storage.getItem(key);pending=null;return baseline?JSON.parse(baseline):null}
 function review(input){
  pending=null;
  if(storage.getItem(key)!==baseline)return deny('stale-review');
  if(!baseline)return deny('missing-save');
  const state=JSON.parse(baseline),result=inspect(state,input);
  pending=JSON.stringify(input);
  return result;
 }
 function decide(action){
  if(!['approve','decline','cancel'].includes(action))throw Error('Explicit GM decision required');
  if(!pending)return deny('review-required');
  const saved=pending;pending=null;
  if(storage.getItem(key)!==baseline)return deny('stale-review');
  if(action!=='approve')return deny(action);
  try{inspect(JSON.parse(baseline),JSON.parse(saved))}catch{return deny('review-invalidated')}
  return deny('settlement-disabled');
 }
 return Object.freeze({review,decide,reload});
}
module.exports={inspect,createSession};
