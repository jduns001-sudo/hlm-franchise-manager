/* Mission 1445: source-backed isolated two-player trade proposal. No production storage access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGuardedPlayerTrade=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function review(state,input){
 if(!state||!Array.isArray(state.universe?.teams)||!Array.isArray(state.universe?.players)||!state.meta)throw Error('Valid isolated GameState required');
 const controlled=String(state.meta.controlledTeamId??'');
 const outgoingId=String(input?.outgoingPlayerId??''),incomingId=String(input?.incomingPlayerId??'');
 if(!outgoingId||!incomingId||outgoingId===incomingId)throw Error('Two distinct player IDs required');
 const players=state.universe.players;
 const outgoing=players.filter(p=>String(p.id)===outgoingId),incoming=players.filter(p=>String(p.id)===incomingId);
 if(outgoing.length!==1||incoming.length!==1)throw Error('Players must exist uniquely in current universe');
 const a=outgoing[0],b=incoming[0],other=String(b.teamId??'');
 if(String(a.teamId)!==controlled)throw Error('Outgoing player must belong to controlled team');
 if(!other||other===controlled||!state.universe.teams.some(t=>String(t.id)===other))throw Error('Incoming player must belong to another existing team');
 if(!state.universe.teams.some(t=>String(t.id)===controlled))throw Error('Controlled team missing');
 if(a.status==='retired'||b.status==='retired')throw Error('Retired players cannot be traded');
 const next=JSON.parse(JSON.stringify(state));
 for(const p of next.universe.players){
  if(String(p.id)===outgoingId)p.teamId=b.teamId;
  if(String(p.id)===incomingId)p.teamId=a.teamId;
 }
 // No inferred contracts, rights, picks, cap room, or AI consent.
 return {nextState:next,summary:{outgoingPlayerId:a.id,incomingPlayerId:b.id,controlledTeamId:a.teamId,otherTeamId:b.teamId,source:'current-isolated-universe',experimental:true}};
}
function createSession(storage,key){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||!key||key==='hlm_front_office_v8')throw Error('Explicit isolated storage required');
 let baseline=storage.getItem(key),pending=null;
 function reload(){baseline=storage.getItem(key);pending=null;return baseline?JSON.parse(baseline):null}
 function propose(input){pending=null;if(storage.getItem(key)!==baseline)throw Error('Stale isolated save; reload');
  if(!baseline)throw Error('No isolated franchise');
  const result=review(JSON.parse(baseline),input);pending={baseline,input:JSON.parse(JSON.stringify(input))};return result.summary;
 }
 function approve(approved){
  if(approved!==true)throw Error('Explicit human GM approval required');
  if(!pending)throw Error('Review trade first');
  const p=pending;pending=null;
  if(storage.getItem(key)!==baseline||p.baseline!==baseline)throw Error('Stale isolated save; reload');
  const result=review(JSON.parse(baseline),p.input);
  // Trade settlement must remain disabled until contracts, cap, restrictions, and receiving-team consent are source-validated.
  throw Error('Trade settlement disabled: contract, cap, restrictions and receiving-team consent not validated');
  if(storage.getItem(key)!==baseline)throw Error('Concurrent isolated save; reload');
  const encoded=JSON.stringify(result.nextState);
  storage.setItem(key,encoded);baseline=encoded;return result.summary;
 }
 return {reload,propose,approve};
}
return {review,createSession};
});
