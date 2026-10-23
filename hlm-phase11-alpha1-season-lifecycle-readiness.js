'use strict';
// Read-only Alpha 1 season lifecycle gate. No invented champion, simulation, or saves.
const {standings,continuity}=require('./hlm-phase11-season-ledger');
function inspectLifecycle(state){
 if(!state||!state.meta||!state.universe||!Array.isArray(state.universe.teams)||!state.activity||!Array.isArray(state.activity.games))throw Error('Explicit isolated season required');
 const controlled=String(state.meta.controlledTeamId??'');
 if(!controlled||state.universe.teams.filter(t=>String(t.id)===controlled).length!==1)throw Error('Human GM team missing or ambiguous');
 const seen=new Set();let finals=0,pending=0;
 for(const game of state.activity.games){
  if(!game||game.id===undefined||game.id===null)throw Error('Game identity missing');
  const id=String(game.id);if(seen.has(id))throw Error('Duplicate game identity');seen.add(id);
  if(game.status==='final')finals++;
  else if(game.status==='scheduled'||game.status==='pending')pending++;
  else throw Error('Unrecognized game status');
 }
 const table=standings(state);
 const complete=state.activity.games.length>0&&pending===0;
 return Object.freeze({status:complete?'regular-season-finals-recorded':'regular-season-in-progress',finals,pending,standings:table,controlledTeamId:controlled,playoffsAuthorized:false,championshipAuthorized:false,offseasonAuthorized:false,nextSeasonAuthorized:false,saved:false,experimental:true,finalDecisionMaker:'human-gm'});
}
function createLifecycleReview(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof key!=='string'||!key||key==='hlm_front_office_v8')throw Error('Isolated storage required');
 let baseline=storage.getItem(key),pending=null,sequence=0;
 const blocked=code=>Object.freeze({status:'blocked',code,saved:false,advanceAuthorized:false});
 function review(){pending=null;sequence++;if(storage.getItem(key)!==baseline)return blocked('stale-season');if(!baseline)return blocked('missing-save');let result;try{result=inspectLifecycle(JSON.parse(baseline))}catch{return blocked('invalid-season')}pending=sequence;return Object.freeze({...result,reviewSequence:sequence})}
 function decide(action,expectedSequence){if(!['approve','decline','cancel'].includes(action))return blocked('unsupported-action');if(pending===null||pending!==expectedSequence)return blocked('stale-or-replayed-decision');pending=null;if(storage.getItem(key)!==baseline)return blocked('stale-season');return blocked(action==='approve'?'lifecycle-advancement-disabled':action)}
 function reload(){baseline=storage.getItem(key);pending=null;sequence++;return blocked('review-cleared')}
 return Object.freeze({review,decide,reload});
}
module.exports={inspectLifecycle,createLifecycleReview,continuity};
