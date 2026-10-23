/* Isolated mobile GM lifecycle review adapter. Delegates writes to existing locked manager. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGuardedMobileLifecycle=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(manager,storage,key){
 if(!manager||typeof manager.peek!=='function'||!storage||typeof storage.getItem!=='function'||key!=='hlm-phase11-m1340-isolated-single-game-v1')throw Error('Existing isolated manager and key required');
 let pending=null,sequence=0;
 function review(action,options={}){
  pending=null;++sequence;
  const baseline=storage.getItem(key);
  const state=manager.peek();
  if(!baseline||!state||!state.meta||!state.universe?.teams?.some(t=>String(t.id)===String(state.meta.controlledTeamId)))throw Error('Isolated controlled franchise required');
  if(action==='playoffs'){
   if(state.extensions?.phase10Playoffs||!state.activity.games.length||state.activity.games.some(g=>g.status!=='final')||state.universe.teams.length<4)throw Error('Completed regular season required');
  }else if(action==='playoff-game'){
   if(state.extensions?.phase10Playoffs?.status!=='active')throw Error('Active playoff series required');
  }else if(action==='archive'){
   if(state.extensions?.phase10Playoffs?.status!=='complete'||state.extensions.phase10Playoffs.championTeamId==null||state.activity.games.some(g=>g.status!=='final')||state.history.seasons.some(s=>s.seasonId===options.seasonId)||!options.seasonId)throw Error('Completed unarchived championship required');
  }else throw Error('Unsupported lifecycle action');
  pending={sequence,baseline,action,options:JSON.parse(JSON.stringify(options))};
  return Object.freeze({reviewSequence:sequence,action,controlledTeamId:state.meta.controlledTeamId,championTeamId:state.extensions?.phase10Playoffs?.championTeamId??null,requiresHumanApproval:true,saved:false});
 }
 function decline(sequenceId){if(!pending||pending.sequence!==sequenceId)return Object.freeze({saved:false,reason:'stale-review'});pending=null;return Object.freeze({saved:false,reason:'declined'});}
 function approve(sequenceId){
  if(!pending||pending.sequence!==sequenceId)throw Error('Stale or replayed GM lifecycle review');
  const selected=pending;pending=null;
  if(storage.getItem(key)!==selected.baseline)throw Error('Isolated save changed; reload and review');
  if(selected.action==='playoffs')return manager.startPlayoffs(true,4,7);
  if(selected.action==='playoff-game')return manager.advancePlayoff(1350,true);
  return manager.archiveSeason(selected.options.seasonId,true);
 }
 function clear(){pending=null;++sequence;}
 return Object.freeze({review,approve,decline,clear});
}
return Object.freeze({create});
});
