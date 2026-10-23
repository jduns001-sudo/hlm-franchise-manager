'use strict';
// Alpha 1 isolated career lifecycle: one human-GM-approved, source-backed engine action per atomic write.
const {startSeasonPlayoffs}=require('./hlm-phase10-season-playoffs');
const {simulateNextPlayoffGame}=require('./hlm-phase10-playoff-simulation');
const {finalizeChampionshipSeason}=require('./hlm-phase10-season-finalization');
const {beginNextSeason}=require('./hlm-phase10-next-season');
const PRODUCTION_KEY='hlm_front_office_v8';
function createGuardedCareerLifecycle(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof key!=='string'||!key||key===PRODUCTION_KEY||!key.startsWith('hlm-phase11-'))throw Error('Explicit isolated lifecycle storage required');
 let baseline=storage.getItem(key),pending=null,sequence=0;
 const block=reason=>Object.freeze({saved:false,reason});
 function review(action,options={}){
  pending=null;++sequence;
  if(storage.getItem(key)!==baseline)return block('stale-save');
  if(!baseline)return block('missing-save');
  let state,result;
  try{
   state=JSON.parse(baseline);
   if(!state.meta||!state.universe?.teams?.some(t=>String(t.id)===String(state.meta.controlledTeamId)))throw Error('Controlled team missing');
   if(action==='start-playoffs')result=startSeasonPlayoffs(state,options.spots??4,7);
   else if(action==='play-playoff-game')result=simulateNextPlayoffGame(state,options.seed??0);
   else if(action==='archive-championship')result=finalizeChampionshipSeason(state,options.seasonId);
   else if(action==='begin-next-season')result=beginNextSeason(state,options);
   else throw Error('Unsupported action');
   if(!result.nextState||String(result.nextState.meta.controlledTeamId)!==String(state.meta.controlledTeamId))throw Error('GM identity changed');
  }catch(e){return block('invalid-transition: '+e.message)}
  pending={sequence,action,options:JSON.parse(JSON.stringify(options)),nextState:result.nextState};
  return Object.freeze({saved:false,reviewSequence:sequence,action,controlledTeamId:state.meta.controlledTeamId,preview:action==='play-playoff-game'?result.result:action==='archive-championship'?result.summary:action==='begin-next-season'?result.summary:result.seeds,requiresHumanApproval:true});
 }
 function decide(choice,expectedSequence){
  if(!pending||pending.sequence!==expectedSequence)return block('stale-or-replayed-review');
  const selected=pending;pending=null;
  if(storage.getItem(key)!==baseline)return block('stale-save');
  if(choice!=='approve')return block(choice==='cancel'||choice==='decline'?choice:'unsupported-decision');
  const next=JSON.stringify(selected.nextState);
  if(storage.getItem(key)!==baseline)return block('stale-save');
  storage.setItem(key,next);
  if(storage.getItem(key)!==next)throw Error('Isolated save verification failed');
  baseline=next;
  return Object.freeze({saved:true,action:selected.action,reviewSequence:expectedSequence});
 }
 function reload(){baseline=storage.getItem(key);pending=null;++sequence;return block('review-cleared')}
 return Object.freeze({review,decide,reload});
}
module.exports={createGuardedCareerLifecycle};
