'use strict';
/* Mission 1507J: isolated, fail-closed GM trade workflow. No storage writes.
 * An in-memory candidate is NOT CPU consent or a settlement authorization.
 */
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
const {inspect}=require('./hlm-phase11-m1507i-trade-invariant-gate');
function create(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof key!=='string'||!key||
  key==='hlm_front_office_v8'||!key.startsWith('hlm-phase11-'))
  throw Error('Explicit Phase 11 isolated franchise storage required');
 let baseline=storage.getItem(key),pending=null;
 const deny=(code)=>Object.freeze({status:'trade-settlement-blocked',code,saved:false,settlementAuthorized:false,experimental:true});
 function reload(){baseline=storage.getItem(key);pending=null;return baseline?JSON.parse(baseline):null}
 function review(input){
  pending=null;
  if(storage.getItem(key)!==baseline)return deny('stale-save');
  if(!baseline)return deny('missing-isolated-save');
  let source;
  try{source=JSON.parse(baseline)}catch{return deny('invalid-save')}
  let preview,verified;
  try{
   preview=propose(source,input);
   verified=inspect(source,input,preview.nextState);
  }catch{return deny('invalid-proposal')}
  if(verified.status!=='trade-proposal-invariants-verified')return deny('invariants-failed');
  if(storage.getItem(key)!==baseline)return deny('stale-save');
  pending={baseline,input:JSON.parse(JSON.stringify(input)),candidate:JSON.stringify(preview.nextState)};
  return Object.freeze({status:'awaiting-human-GM-decision',review:preview.review,
   settlementAuthorized:false,saved:false,experimental:true});
 }
 function decide(action){
  if(!['approve','decline','cancel'].includes(action))throw Error('Explicit GM trade decision required');
  if(!pending)return deny('review-required');
  const p=pending;pending=null;
  if(storage.getItem(key)!==baseline||p.baseline!==baseline)return deny('stale-save');
  if(action!=='approve')return deny(action);
  let source;
  try{source=JSON.parse(baseline)}catch{return deny('invalid-save')}
  const verified=inspect(source,p.input,JSON.parse(p.candidate));
  if(verified.status!=='trade-proposal-invariants-verified')return deny('invariants-failed');
  // GM approval alone is insufficient: no independent CPU authority or atomic adapter.
  return deny('cpu-authority-and-atomic-settlement-unavailable');
 }
 return Object.freeze({reload,review,decide});
}
module.exports={create};
